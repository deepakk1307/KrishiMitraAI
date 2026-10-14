/**
 * Farmer Repository (PostgreSQL & In-Memory implementations)
 */

import type { IFarmerRepository } from '../database/dbInterface.ts';
import type { FarmerProfile } from '../models/farmer.ts';
import { PostgresClient, pgClient } from '../database/postgresClient.ts';

export const SEED_FARMERS: FarmerProfile[] = [
  {
    id: 'farmer-ramesh-kumar',
    userId: 'user-ramesh-kumar',
    name: 'Ramesh Kumar',
    email: 'ramesh@krishimitra.ai',
    phone: '+919876543210',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    village: 'Malihabad',
    language: 'Hindi',
    land_size: 2,
    land_unit: 'acres',
    crop: 'Wheat',
    secondary_crops: ['Mustard', 'Paddy'],
    soil_type: 'Alluvial Loam',
    irrigation_source: 'tubewell',
    created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    updated_at: new Date('2026-08-01T10:00:00Z').toISOString(),
  },
  {
    id: 'farmer-sunita-devi',
    userId: 'user-sunita-devi',
    name: 'Sunita Devi',
    email: 'sunita@krishimitra.ai',
    phone: '+919811223344',
    state: 'Madhya Pradesh',
    district: 'Indore',
    village: 'Sanwer',
    language: 'Hindi',
    land_size: 3.5,
    land_unit: 'acres',
    crop: 'Soybean',
    secondary_crops: ['Wheat', 'Gram'],
    soil_type: 'Black Cotton',
    irrigation_source: 'rainfed',
    created_at: new Date('2026-02-15T09:00:00Z').toISOString(),
    updated_at: new Date('2026-08-05T11:00:00Z').toISOString(),
  },
  {
    id: 'farmer-balwinder-singh',
    userId: 'user-balwinder-singh',
    name: 'Balwinder Singh',
    email: 'balwinder@krishimitra.ai',
    phone: '+919822334455',
    state: 'Punjab',
    district: 'Ludhiana',
    village: 'Samrala',
    language: 'English',
    land_size: 6,
    land_unit: 'acres',
    crop: 'Paddy',
    secondary_crops: ['Wheat', 'Potato'],
    soil_type: 'Sandy Loam',
    irrigation_source: 'tubewell',
    created_at: new Date('2026-03-01T07:30:00Z').toISOString(),
    updated_at: new Date('2026-08-10T14:20:00Z').toISOString(),
  },
];

export class PostgresFarmerRepository implements IFarmerRepository {
  private client: PostgresClient;

  constructor(client: PostgresClient = pgClient) {
    this.client = client;
  }

  async getById(id: string): Promise<FarmerProfile | null> {
    const res = await this.client.query<any>(
      `SELECT id, user_id, name, email, phone, state, district, village, language, 
              land_size, land_unit, crop, secondary_crops, soil_type, irrigation_source, 
              created_at, updated_at 
       FROM farmers WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (!res.rows || res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      state: row.state,
      district: row.district,
      village: row.village,
      language: row.language || 'Hindi',
      land_size: Number(row.land_size),
      land_unit: row.land_unit || 'acres',
      crop: row.crop,
      secondary_crops: Array.isArray(row.secondary_crops) ? row.secondary_crops : [],
      soil_type: row.soil_type,
      irrigation_source: row.irrigation_source || 'tubewell',
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async getByPhone(phone: string): Promise<FarmerProfile | null> {
    const res = await this.client.query<any>(`SELECT * FROM farmers WHERE phone = $1 LIMIT 1`, [phone]);
    if (!res.rows || res.rows.length === 0) return null;
    return this.getById(res.rows[0].id);
  }

  async getByEmail(email: string): Promise<FarmerProfile | null> {
    const res = await this.client.query<any>(`SELECT * FROM farmers WHERE LOWER(email) = LOWER($1) LIMIT 1`, [email.trim()]);
    if (!res.rows || res.rows.length === 0) return null;
    return this.getById(res.rows[0].id);
  }

  async getDefaultProfile(): Promise<FarmerProfile> {
    const profile = await this.getById('farmer-ramesh-kumar');
    if (profile) return profile;

    return {
      id: 'farmer-ramesh-kumar',
      name: 'Ramesh Kumar',
      email: 'ramesh@krishimitra.ai',
      phone: '+919876543210',
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      village: 'Malihabad',
      language: 'Hindi',
      land_size: 2,
      land_unit: 'acres',
      crop: 'Wheat',
      secondary_crops: ['Mustard', 'Paddy'],
      soil_type: 'Alluvial Loam',
      irrigation_source: 'tubewell',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async create(profile: Omit<FarmerProfile, 'id' | 'created_at' | 'updated_at'>): Promise<FarmerProfile> {
    const id = `farmer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    await this.client.query(
      `INSERT INTO farmers (id, user_id, name, email, phone, state, district, village, language, land_size, land_unit, crop, secondary_crops, soil_type, irrigation_source, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        id,
        profile.userId || null,
        profile.name,
        profile.email || null,
        profile.phone || null,
        profile.state,
        profile.district,
        profile.village || null,
        profile.language || 'Hindi',
        profile.land_size,
        profile.land_unit || 'acres',
        profile.crop,
        JSON.stringify(profile.secondary_crops || []),
        profile.soil_type || null,
        profile.irrigation_source || 'tubewell',
        now,
        now,
      ]
    );

    return {
      ...profile,
      id,
      created_at: now,
      updated_at: now,
    };
  }

  async update(id: string, updates: Partial<FarmerProfile>): Promise<FarmerProfile | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated: FarmerProfile = {
      ...existing,
      ...updates,
      id: existing.id,
      updated_at: new Date().toISOString(),
    };

    await this.client.query(
      `UPDATE farmers 
       SET name = $1, state = $2, district = $3, crop = $4, land_size = $5, language = $6, updated_at = $7
       WHERE id = $8`,
      [updated.name, updated.state, updated.district, updated.crop, updated.land_size, updated.language, updated.updated_at, id]
    );

    return updated;
  }

  async listAll(): Promise<FarmerProfile[]> {
    const res = await this.client.query<any>(`SELECT id FROM farmers ORDER BY created_at DESC`);
    const list: FarmerProfile[] = [];
    for (const r of res.rows) {
      const f = await this.getById(r.id);
      if (f) list.push(f);
    }
    return list;
  }
}

export class InMemoryFarmerRepository implements IFarmerRepository {
  private farmers: Map<string, FarmerProfile> = new Map();

  constructor() {
    for (const f of SEED_FARMERS) {
      this.farmers.set(f.id, { ...f });
    }
  }

  async getById(id: string): Promise<FarmerProfile | null> {
    return this.farmers.get(id) || null;
  }

  async getByPhone(phone: string): Promise<FarmerProfile | null> {
    for (const farmer of this.farmers.values()) {
      if (farmer.phone === phone) return { ...farmer };
    }
    return null;
  }

  async getByEmail(email: string): Promise<FarmerProfile | null> {
    const clean = email.toLowerCase().trim();
    for (const farmer of this.farmers.values()) {
      if (farmer.email?.toLowerCase() === clean) return { ...farmer };
    }
    return null;
  }

  async getDefaultProfile(): Promise<FarmerProfile> {
    const defaultFarmer = this.farmers.get('farmer-ramesh-kumar');
    if (!defaultFarmer) {
      throw new Error('Default farmer profile not found in repository');
    }
    return { ...defaultFarmer };
  }

  async create(profile: Omit<FarmerProfile, 'id' | 'created_at' | 'updated_at'>): Promise<FarmerProfile> {
    const id = `farmer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newFarmer: FarmerProfile = {
      ...profile,
      id,
      created_at: now,
      updated_at: now,
    };
    this.farmers.set(id, newFarmer);
    return { ...newFarmer };
  }

  async update(id: string, updates: Partial<FarmerProfile>): Promise<FarmerProfile | null> {
    const existing = this.farmers.get(id);
    if (!existing) return null;
    const updated: FarmerProfile = {
      ...existing,
      ...updates,
      id: existing.id,
      updated_at: new Date().toISOString(),
    };
    this.farmers.set(id, updated);
    return { ...updated };
  }

  async listAll(): Promise<FarmerProfile[]> {
    return Array.from(this.farmers.values()).map((f) => ({ ...f }));
  }
}
