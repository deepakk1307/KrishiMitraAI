/**
 * Mandi Repository (PostgreSQL & In-Memory implementations)
 */

import type { IMandiRepository } from '../database/dbInterface.ts';
import type { MandiPriceRecord, MandiQuery } from '../models/mandi.ts';
import { PostgresClient, pgClient } from '../database/postgresClient.ts';
import { mandiApiClient } from '../services/mandi/mandiApiClient.ts';

export class PostgresMandiRepository implements IMandiRepository {
  private client: PostgresClient;

  constructor(client: PostgresClient = pgClient) {
    this.client = client;
  }

  async getPrices(query: MandiQuery): Promise<MandiPriceRecord | null> {
    return mandiApiClient.fetchMandiData(query);
  }

  async getAllCrops(): Promise<string[]> {
    return ['Wheat', 'Mustard', 'Paddy', 'Rice', 'Cotton', 'Maize', 'Sugarcane', 'Potato', 'Onion', 'Tomato', 'Soybean', 'Gram'];
  }

  async getAllStates(): Promise<string[]> {
    return ['Uttar Pradesh', 'Punjab', 'Haryana', 'Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Bihar', 'Gujarat'];
  }

  async getDistrictsForState(state: string): Promise<string[]> {
    const map: Record<string, string[]> = {
      'Uttar Pradesh': ['Lucknow', 'Barabanki', 'Sitapur', 'Kanpur Nagar', 'Varanasi', 'Meerut', 'Agra', 'Gorakhpur', 'Aligarh'],
      'Punjab': ['Ludhiana', 'Khanna', 'Jalandhar', 'Amritsar', 'Patiala', 'Bathinda'],
      'Madhya Pradesh': ['Indore', 'Bhopal', 'Ujjain', 'Dewas', 'Jabalpur', 'Gwalior'],
      'Maharashtra': ['Nagpur', 'Amravati', 'Nashik', 'Pune', 'Aurangabad', 'Solapur'],
      'Haryana': ['Karnal', 'Kurukshetra', 'Ambala', 'Hisar', 'Rohtak'],
      'Rajasthan': ['Jaipur', 'Kota', 'Sri Ganganagar', 'Bikaner', 'Jodhpur'],
    };
    return map[state] || ['Central District', 'North District', 'South District'];
  }
}

export class InMemoryMandiRepository implements IMandiRepository {
  private customRecords: Map<string, MandiPriceRecord> = new Map();

  private makeKey(crop: string, state?: string, district?: string): string {
    return `${(crop || '').toLowerCase()}::${(state || 'any').toLowerCase()}::${(district || 'any').toLowerCase()}`;
  }

  async getPrices(query: MandiQuery): Promise<MandiPriceRecord | null> {
    const key = this.makeKey(query.crop, query.state, query.district);
    if (this.customRecords.has(key)) {
      return { ...this.customRecords.get(key)! };
    }

    return mandiApiClient.fetchMandiData(query);
  }

  async getAllCrops(): Promise<string[]> {
    return ['Wheat', 'Mustard', 'Paddy', 'Rice', 'Cotton', 'Maize', 'Sugarcane', 'Potato', 'Onion', 'Tomato', 'Soybean', 'Gram'];
  }

  async getAllStates(): Promise<string[]> {
    return ['Uttar Pradesh', 'Punjab', 'Haryana', 'Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Bihar', 'Gujarat'];
  }

  async getDistrictsForState(state: string): Promise<string[]> {
    const map: Record<string, string[]> = {
      'Uttar Pradesh': ['Lucknow', 'Barabanki', 'Sitapur', 'Kanpur Nagar', 'Varanasi', 'Meerut', 'Agra', 'Gorakhpur', 'Aligarh'],
      'Punjab': ['Ludhiana', 'Khanna', 'Jalandhar', 'Amritsar', 'Patiala', 'Bathinda'],
      'Madhya Pradesh': ['Indore', 'Bhopal', 'Ujjain', 'Dewas', 'Jabalpur', 'Gwalior'],
      'Maharashtra': ['Nagpur', 'Amravati', 'Nashik', 'Pune', 'Aurangabad', 'Solapur'],
      'Haryana': ['Karnal', 'Kurukshetra', 'Ambala', 'Hisar', 'Rohtak'],
      'Rajasthan': ['Jaipur', 'Kota', 'Sri Ganganagar', 'Bikaner', 'Jodhpur'],
    };
    return map[state] || ['Central District', 'North District', 'South District'];
  }

  async seedRecords(records: MandiPriceRecord[]): Promise<void> {
    for (const r of records) {
      const key = this.makeKey(r.crop, r.state, r.district);
      this.customRecords.set(key, { ...r });
    }
  }
}
