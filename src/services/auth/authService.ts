/**
 * Production Authentication & Cryptographic Token Service
 */

import crypto from 'node:crypto';
import type {
  UserAccount,
  FarmerProfile,
  AuthTokenPayload,
  RegisterFarmerDto,
  LoginDto,
  AuthResponse,
} from '../../models/farmer.ts';
import { db } from '../../database/inMemoryDb.ts';
import { AuthError, ValidationError, NotFoundError } from '../../utils/errors.ts';
import { config } from '../../config/index.ts';

export class AuthService {
  private secret: string;

  constructor(secret = config.jwtSecret) {
    this.secret = secret;
  }

  hashPassword(password: string, customSalt?: string): { hash: string; salt: string } {
    if (!password || password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long.');
    }
    const salt = customSalt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return { hash, salt };
  }

  verifyPassword(password: string, hash: string, salt: string): boolean {
    try {
      const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
      const hashBuffer = Buffer.from(hash, 'hex');
      const computedBuffer = Buffer.from(computedHash, 'hex');
      if (hashBuffer.length !== computedBuffer.length) return false;
      return crypto.timingSafeEqual(hashBuffer, computedBuffer);
    } catch (e) {
      return false;
    }
  }

  generateJwtToken(
    payload: { uid: string; email: string; name: string; farmerId: string; role?: 'farmer' | 'admin' },
    expiresInHours = config.tokenExpiryHours
  ): string {
    const nowSec = Math.floor(Date.now() / 1000);
    const expSec = nowSec + expiresInHours * 3600;

    const fullPayload: AuthTokenPayload = {
      uid: payload.uid,
      email: payload.email,
      name: payload.name,
      farmerId: payload.farmerId,
      role: payload.role || 'farmer',
      iat: nowSec,
      exp: expSec,
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');

    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(`${b64Header}.${b64Payload}`)
      .digest('base64url');

    return `${b64Header}.${b64Payload}.${signature}`;
  }

  verifyJwtToken(token: string): AuthTokenPayload {
    if (!token || typeof token !== 'string') {
      throw new AuthError('Authentication token is required.');
    }

    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      throw new AuthError('Invalid token format.');
    }

    const [b64Header, b64Payload, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(`${b64Header}.${b64Payload}`)
      .digest('base64url');

    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
      throw new AuthError('Invalid token signature. Authentication failed.');
    }

    let payload: AuthTokenPayload;
    try {
      payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    } catch (e) {
      throw new AuthError('Malformed token payload.');
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSec) {
      throw new AuthError('Authentication token has expired. Please log in again.');
    }

    return payload;
  }

  async register(dto: RegisterFarmerDto): Promise<AuthResponse> {
    if (!dto.email || !dto.email.includes('@')) {
      throw new ValidationError('A valid email address is required.');
    }
    if (!dto.password || dto.password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long.');
    }
    if (!dto.name || !dto.name.trim()) {
      throw new ValidationError('Farmer full name is required.');
    }
    if (!dto.state || !dto.state.trim()) {
      throw new ValidationError('State is required.');
    }
    if (!dto.district || !dto.district.trim()) {
      throw new ValidationError('District is required.');
    }
    if (!dto.crop || !dto.crop.trim()) {
      throw new ValidationError('Primary crop is required.');
    }
    if (dto.land_size === undefined || dto.land_size <= 0) {
      throw new ValidationError('Land size must be greater than 0.');
    }

    const cleanEmail = dto.email.trim().toLowerCase();

    const existingUser = await db.user.findByEmail(cleanEmail);
    if (existingUser) {
      throw new ValidationError(`An account with email '${cleanEmail}' already exists. Please log in instead.`);
    }

    const farmer = await db.farmer.create({
      name: dto.name.trim(),
      email: cleanEmail,
      phone: dto.phone,
      state: dto.state.trim(),
      district: dto.district.trim(),
      village: dto.village?.trim(),
      language: dto.language || 'Hindi',
      land_size: Number(dto.land_size),
      land_unit: dto.land_unit || 'acres',
      crop: dto.crop.trim(),
      secondary_crops: dto.secondary_crops || [],
      soil_type: dto.soil_type,
      irrigation_source: dto.irrigation_source || 'tubewell',
    });

    const { hash, salt } = this.hashPassword(dto.password);
    const user = await db.user.create({
      email: cleanEmail,
      passwordHash: hash,
      salt,
      name: dto.name.trim(),
      farmerId: farmer.id,
      role: 'farmer',
    });

    await db.farmer.update(farmer.id, { userId: user.id });

    const token = this.generateJwtToken({
      uid: user.id,
      email: user.email,
      name: user.name,
      farmerId: farmer.id,
      role: user.role,
    });

    return {
      token,
      expiresIn: config.tokenExpiryHours * 3600,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        farmerId: farmer.id,
        role: user.role,
      },
      farmer,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    if (!dto.email || !dto.password) {
      throw new ValidationError('Email and password are required.');
    }

    const cleanEmail = dto.email.trim().toLowerCase();
    const user = await db.user.findByEmail(cleanEmail);

    if (!user) {
      throw new AuthError('Invalid email or password.');
    }

    const isValid = this.verifyPassword(dto.password, user.passwordHash, user.salt);
    if (!isValid) {
      throw new AuthError('Invalid email or password.');
    }

    const farmer = await db.farmer.getById(user.farmerId);
    if (!farmer) {
      throw new NotFoundError(`Farmer profile for user '${user.id}'`);
    }

    const token = this.generateJwtToken({
      uid: user.id,
      email: user.email,
      name: user.name,
      farmerId: farmer.id,
      role: user.role,
    });

    return {
      token,
      expiresIn: config.tokenExpiryHours * 3600,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        farmerId: farmer.id,
        role: user.role,
      },
      farmer,
    };
  }

  async demoLogin(demoFarmerId: string): Promise<AuthResponse> {
    const isDev = config.nodeEnv !== 'production';
    if (!isDev) {
      throw new AuthError('Demo login is only available in development mode.');
    }

    const farmer = await db.farmer.getById(demoFarmerId);
    if (!farmer) {
      throw new NotFoundError(`Demo farmer profile '${demoFarmerId}'`);
    }

    let user = await db.user.findByFarmerId(farmer.id);
    if (!user) {
      const email = `${farmer.name.toLowerCase().replace(/\s+/g, '.')}@krishimitra.demo`;
      const { hash, salt } = this.hashPassword('Demo@123456');
      user = await db.user.create({
        email,
        passwordHash: hash,
        salt,
        name: farmer.name,
        farmerId: farmer.id,
        role: 'farmer',
      });
    }

    const token = this.generateJwtToken({
      uid: user.id,
      email: user.email,
      name: user.name,
      farmerId: farmer.id,
      role: user.role,
    });

    return {
      token,
      expiresIn: config.tokenExpiryHours * 3600,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        farmerId: farmer.id,
        role: user.role,
      },
      farmer,
    };
  }

  async getMe(userId: string): Promise<{ user: UserAccount; farmer: FarmerProfile }> {
    const user = await db.user.findById(userId);
    if (!user) {
      throw new AuthError('User account not found.');
    }
    const farmer = await db.farmer.getById(user.farmerId);
    if (!farmer) {
      throw new NotFoundError(`Farmer profile for user '${user.id}'`);
    }
    return { user, farmer };
  }
}

export const authService = new AuthService();
