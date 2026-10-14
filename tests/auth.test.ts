/**
 * Production Authentication & JWT Security Test Suite
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { authService } from '../src/services/auth/authService.ts';
import { resolveFarmerContext, type AuthenticatedRequest } from '../src/middleware/auth.ts';
import { db } from '../src/database/inMemoryDb.ts';
import { AuthError, ValidationError } from '../src/utils/errors.ts';

describe('Production Authentication & JWT Security Test Suite', () => {
  before(async () => {
    await db.connect();
  });

  it('1. Registration: should create user, farmer profile, and return valid JWT', async () => {
    const email = `test.farmer.${Date.now()}@krishimitra.ai`;
    const regRes = await authService.register({
      email,
      password: 'SecurePassword@123',
      name: 'Virender Sehwag',
      state: 'Haryana',
      district: 'Jhajjar',
      language: 'Hindi',
      land_size: 4.5,
      land_unit: 'acres',
      crop: 'Mustard',
      secondary_crops: ['Wheat'],
    });

    assert.ok(regRes.token, 'Token must be issued upon registration');
    assert.equal(regRes.user.email, email.toLowerCase());
    assert.equal(regRes.farmer.name, 'Virender Sehwag');
    assert.equal(regRes.farmer.crop, 'Mustard');
    assert.equal(regRes.farmer.state, 'Haryana');

    const decoded = authService.verifyJwtToken(regRes.token);
    assert.equal(decoded.email, email.toLowerCase());
    assert.equal(decoded.farmerId, regRes.farmer.id);
  });

  it('2. Registration: should reject duplicate email address', async () => {
    const email = `duplicate.farmer.${Date.now()}@krishimitra.ai`;
    await authService.register({
      email,
      password: 'Password@123',
      name: 'Farmer One',
      state: 'Punjab',
      district: 'Amritsar',
      crop: 'Wheat',
      land_size: 2,
    });

    await assert.rejects(
      async () => {
        await authService.register({
          email,
          password: 'Password@123',
          name: 'Farmer Two',
          state: 'Punjab',
          district: 'Amritsar',
          crop: 'Wheat',
          land_size: 2,
        });
      },
      (err: any) => {
        assert.ok(err instanceof ValidationError);
        assert.ok(err.message.includes('already exists'));
        return true;
      }
    );
  });

  it('3. Registration: should reject weak password (<6 characters)', async () => {
    await assert.rejects(
      async () => {
        await authService.register({
          email: `weakpass.${Date.now()}@krishimitra.ai`,
          password: '123',
          name: 'Farmer Weak',
          state: 'Bihar',
          district: 'Patna',
          crop: 'Paddy',
          land_size: 1,
        });
      },
      (err: any) => {
        assert.ok(err instanceof ValidationError);
        assert.ok(err.message.includes('at least 6 characters'));
        return true;
      }
    );
  });

  it('4. Login: should succeed with correct email and password', async () => {
    const email = `login.farmer.${Date.now()}@krishimitra.ai`;
    const password = 'CorrectPassword@2026';

    await authService.register({
      email,
      password,
      name: 'Ravi Shastri',
      state: 'Maharashtra',
      district: 'Nagpur',
      crop: 'Cotton',
      land_size: 5,
    });

    const loginRes = await authService.login({ email, password });
    assert.ok(loginRes.token);
    assert.equal(loginRes.user.email, email.toLowerCase());
    assert.equal(loginRes.farmer.crop, 'Cotton');
  });

  it('5. Login: should reject invalid password with 401 AuthError', async () => {
    const email = `wrongpass.farmer.${Date.now()}@krishimitra.ai`;
    await authService.register({
      email,
      password: 'CorrectPassword@123',
      name: 'Farmer WrongPass',
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      crop: 'Wheat',
      land_size: 2,
    });

    await assert.rejects(
      async () => {
        await authService.login({ email, password: 'WrongPassword@999' });
      },
      (err: any) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.statusCode, 401);
        return true;
      }
    );
  });

  it('6. Login: should reject nonexistent email with 401 AuthError', async () => {
    await assert.rejects(
      async () => {
        await authService.login({
          email: 'nonexistent.farmer.999@krishimitra.ai',
          password: 'SomePassword@123',
        });
      },
      (err: any) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.statusCode, 401);
        return true;
      }
    );
  });

  it('7. Protected Endpoint: missing token should return 401 Unauthorized (No Ramesh Fallback)', async () => {
    const unauthReq: AuthenticatedRequest = {
      headers: {},
      query: {},
      params: {},
    };

    await assert.rejects(
      async () => {
        await resolveFarmerContext(unauthReq);
      },
      (err: any) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.statusCode, 401);
        assert.ok(err.message.includes('Authentication required'));
        return true;
      }
    );
  });

  it('8. Protected Endpoint: tampered/invalid signature token should return 401 Unauthorized', async () => {
    const validToken = authService.generateJwtToken({
      uid: 'user-123',
      email: 'hacker@krishimitra.ai',
      name: 'Hacker',
      farmerId: 'farmer-ramesh-kumar',
    });

    const parts = validToken.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ farmerId: 'farmer-balwinder-singh' })).toString('base64url');
    const forgedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const req: AuthenticatedRequest = {
      headers: { authorization: `Bearer ${forgedToken}` },
      query: {},
      params: {},
    };

    await assert.rejects(
      async () => {
        await resolveFarmerContext(req);
      },
      (err: any) => {
        assert.ok(err instanceof AuthError);
        assert.equal(err.statusCode, 401);
        return true;
      }
    );
  });

  it('9. Protected Endpoint: expired token should return 401 Unauthorized', async () => {
    const expiredToken = authService.generateJwtToken(
      {
        uid: 'user-expired',
        email: 'expired@krishimitra.ai',
        name: 'Expired User',
        farmerId: 'farmer-ramesh-kumar',
      },
      -10
    );

    const req: AuthenticatedRequest = {
      headers: { authorization: `Bearer ${expiredToken}` },
      query: {},
      params: {},
    };

    await assert.rejects(
      async () => {
        await resolveFarmerContext(req);
      },
      (err: any) => {
        assert.ok(err instanceof AuthError);
        assert.ok(err.message.includes('expired'));
        return true;
      }
    );
  });

  it('10. Zero-Trust Enforcement: Client-sent x-farmer-id or body.farmerId must be ignored', async () => {
    const email = `sunita.real.${Date.now()}@krishimitra.ai`;
    const regRes = await authService.register({
      email,
      password: 'Password@1234',
      name: 'Sunita Devi Authentic',
      state: 'Madhya Pradesh',
      district: 'Indore',
      crop: 'Soybean',
      land_size: 3.5,
    });

    const req: AuthenticatedRequest = {
      headers: {
        authorization: `Bearer ${regRes.token}`,
        'x-farmer-id': 'farmer-ramesh-kumar',
      },
      body: { farmerId: 'farmer-balwinder-singh' },
      query: {},
      params: {},
    };

    const resolvedFarmer = await resolveFarmerContext(req);
    assert.equal(resolvedFarmer.id, regRes.farmer.id);
    assert.notEqual(resolvedFarmer.id, 'farmer-ramesh-kumar');
    assert.notEqual(resolvedFarmer.id, 'farmer-balwinder-singh');
    assert.equal(resolvedFarmer.name, 'Sunita Devi Authentic');
  });

  it('11. Demo Login: should succeed for seeded accounts in development mode', async () => {
    const demoRes = await authService.demoLogin('farmer-ramesh-kumar');
    assert.ok(demoRes.token);
    assert.equal(demoRes.farmer.name, 'Ramesh Kumar');
    assert.equal(demoRes.farmer.crop, 'Wheat');
  });
});
