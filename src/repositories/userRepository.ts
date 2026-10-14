/**
 * User Repository (PostgreSQL & In-Memory implementations)
 */

import type { IUserRepository } from '../database/dbInterface.ts';
import type { UserAccount } from '../models/farmer.ts';
import { PostgresClient, pgClient } from '../database/postgresClient.ts';

const DEMO_SALT = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
const DEMO_PASSWORD_HASH = '9b6d8594ff9c5cf8c6a0c000574f07a0cbe2b35041ff34e7bb41bfec35a9ea892bebeab6f8e79c6d5964f40f09ceb10886566085a6ad9eb09279dcda1e149488';

export const SEED_USERS: UserAccount[] = [
  {
    id: 'user-ramesh-kumar',
    email: 'ramesh@krishimitra.ai',
    name: 'Ramesh Kumar',
    passwordHash: DEMO_PASSWORD_HASH,
    salt: DEMO_SALT,
    farmerId: 'farmer-ramesh-kumar',
    role: 'farmer',
    createdAt: new Date('2026-01-10T08:00:00Z').toISOString(),
    updatedAt: new Date('2026-08-01T10:00:00Z').toISOString(),
  },
  {
    id: 'user-sunita-devi',
    email: 'sunita@krishimitra.ai',
    name: 'Sunita Devi',
    passwordHash: DEMO_PASSWORD_HASH,
    salt: DEMO_SALT,
    farmerId: 'farmer-sunita-devi',
    role: 'farmer',
    createdAt: new Date('2026-02-15T09:00:00Z').toISOString(),
    updatedAt: new Date('2026-08-05T11:00:00Z').toISOString(),
  },
  {
    id: 'user-balwinder-singh',
    email: 'balwinder@krishimitra.ai',
    name: 'Balwinder Singh',
    passwordHash: DEMO_PASSWORD_HASH,
    salt: DEMO_SALT,
    farmerId: 'farmer-balwinder-singh',
    role: 'farmer',
    createdAt: new Date('2026-03-01T07:30:00Z').toISOString(),
    updatedAt: new Date('2026-08-10T14:20:00Z').toISOString(),
  },
];

export class PostgresUserRepository implements IUserRepository {
  private client: PostgresClient;

  constructor(client: PostgresClient = pgClient) {
    this.client = client;
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    const clean = email.toLowerCase().trim();
    const res = await this.client.query<any>(
      `SELECT id, email, password_hash, salt, name, farmer_id, role, created_at, updated_at 
       FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [clean]
    );
    if (!res.rows || res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      salt: row.salt,
      name: row.name,
      farmerId: row.farmer_id,
      role: row.role || 'farmer',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string): Promise<UserAccount | null> {
    const res = await this.client.query<any>(
      `SELECT id, email, password_hash, salt, name, farmer_id, role, created_at, updated_at 
       FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (!res.rows || res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      salt: row.salt,
      name: row.name,
      farmerId: row.farmer_id,
      role: row.role || 'farmer',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByFarmerId(farmerId: string): Promise<UserAccount | null> {
    const res = await this.client.query<any>(
      `SELECT id, email, password_hash, salt, name, farmer_id, role, created_at, updated_at 
       FROM users WHERE farmer_id = $1 LIMIT 1`,
      [farmerId]
    );
    if (!res.rows || res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      salt: row.salt,
      name: row.name,
      farmerId: row.farmer_id,
      role: row.role || 'farmer',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(user: Omit<UserAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserAccount> {
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const cleanEmail = user.email.toLowerCase().trim();

    await this.client.query(
      `INSERT INTO users (id, email, password_hash, salt, name, farmer_id, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, cleanEmail, user.passwordHash, user.salt, user.name, user.farmerId, user.role || 'farmer', now, now]
    );

    return {
      id,
      email: cleanEmail,
      passwordHash: user.passwordHash,
      salt: user.salt,
      name: user.name,
      farmerId: user.farmerId,
      role: user.role || 'farmer',
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(id: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: UserAccount = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    await this.client.query(
      `UPDATE users 
       SET email = $1, password_hash = $2, salt = $3, name = $4, role = $5, updated_at = $6
       WHERE id = $7`,
      [updated.email, updated.passwordHash, updated.salt, updated.name, updated.role, updated.updatedAt, id]
    );

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.client.query(`DELETE FROM users WHERE id = $1`, [id]);
    return res.rowCount > 0;
  }

  async listAll(): Promise<UserAccount[]> {
    const res = await this.client.query<any>(`SELECT * FROM users ORDER BY created_at DESC`);
    return res.rows.map((row) => ({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      salt: row.salt,
      name: row.name,
      farmerId: row.farmer_id,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
}

export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, UserAccount> = new Map();

  constructor() {
    for (const u of SEED_USERS) {
      this.users.set(u.id, { ...u });
    }
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    const clean = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === clean) {
        return { ...user };
      }
    }
    return null;
  }

  async findById(id: string): Promise<UserAccount | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async findByFarmerId(farmerId: string): Promise<UserAccount | null> {
    for (const user of this.users.values()) {
      if (user.farmerId === farmerId) {
        return { ...user };
      }
    }
    return null;
  }

  async create(user: Omit<UserAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserAccount> {
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newUser: UserAccount = {
      ...user,
      id,
      email: user.email.toLowerCase().trim(),
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, newUser);
    return { ...newUser };
  }

  async update(id: string, updates: Partial<UserAccount>): Promise<UserAccount | null> {
    const existing = this.users.get(id);
    if (!existing) return null;
    const updated: UserAccount = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async listAll(): Promise<UserAccount[]> {
    return Array.from(this.users.values()).map((u) => ({ ...u }));
  }
}
