/**
 * Scheme Repository (PostgreSQL & In-Memory implementations)
 */

import type { ISchemeRepository } from '../database/dbInterface.ts';
import type { GovernmentScheme, SchemeEligibilityFilter } from '../models/schemes.ts';
import { PostgresClient, pgClient } from '../database/postgresClient.ts';
import { VERIFIED_SCHEMES } from '../services/rag/schemeDataset.ts';

export class PostgresSchemeRepository implements ISchemeRepository {
  private client: PostgresClient;

  constructor(client: PostgresClient = pgClient) {
    this.client = client;
  }

  async getAll(): Promise<GovernmentScheme[]> {
    return [...VERIFIED_SCHEMES];
  }

  async getById(id: string): Promise<GovernmentScheme | null> {
    return VERIFIED_SCHEMES.find((s) => s.id === id) || null;
  }

  async filter(filter: SchemeEligibilityFilter): Promise<GovernmentScheme[]> {
    const results: GovernmentScheme[] = [];
    const targetState = filter.state?.toLowerCase();
    const targetCrop = filter.crop?.toLowerCase();
    const landSize = filter.land_size;

    for (const scheme of VERIFIED_SCHEMES) {
      const schemeState = scheme.state.toLowerCase();
      const stateMatch =
        schemeState === 'all india' ||
        !targetState ||
        schemeState === targetState ||
        targetState.includes(schemeState);

      if (!stateMatch) continue;

      let cropMatch = true;
      if (targetCrop) {
        cropMatch = scheme.eligibleCrops.some((c) => {
          const cl = c.toLowerCase();
          return cl === 'all crops' || cl === targetCrop || targetCrop.includes(cl);
        });
      }
      if (!cropMatch) continue;

      if (landSize !== undefined && landSize !== null) {
        const { min_acres, max_acres } = scheme.landRequirements;
        if (min_acres !== undefined && landSize < min_acres) continue;
        if (max_acres !== undefined && landSize > max_acres) continue;
      }

      if (filter.category && scheme.category !== filter.category) {
        continue;
      }

      results.push({ ...scheme });
    }

    return results;
  }

  async search(query: string): Promise<GovernmentScheme[]> {
    const q = query.toLowerCase();
    return VERIFIED_SCHEMES.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.hindi_name && s.hindi_name.includes(q)) ||
        s.description.toLowerCase().includes(q) ||
        s.eligibleCrops.some((c) => c.toLowerCase().includes(q))
    );
  }

  async addScheme(scheme: GovernmentScheme): Promise<GovernmentScheme> {
    return scheme;
  }
}

export class InMemorySchemeRepository implements ISchemeRepository {
  private schemes: Map<string, GovernmentScheme> = new Map();

  constructor() {
    for (const s of VERIFIED_SCHEMES) {
      this.schemes.set(s.id, { ...s });
    }
  }

  async getAll(): Promise<GovernmentScheme[]> {
    return Array.from(this.schemes.values()).map((s) => ({ ...s }));
  }

  async getById(id: string): Promise<GovernmentScheme | null> {
    return this.schemes.get(id) || null;
  }

  async filter(filter: SchemeEligibilityFilter): Promise<GovernmentScheme[]> {
    const results: GovernmentScheme[] = [];
    const targetState = filter.state?.toLowerCase();
    const targetCrop = filter.crop?.toLowerCase();
    const landSize = filter.land_size;

    for (const scheme of this.schemes.values()) {
      const schemeState = scheme.state.toLowerCase();
      const stateMatch =
        schemeState === 'all india' ||
        !targetState ||
        schemeState === targetState ||
        targetState.includes(schemeState);

      if (!stateMatch) continue;

      let cropMatch = true;
      if (targetCrop) {
        cropMatch = scheme.eligibleCrops.some((c) => {
          const cl = c.toLowerCase();
          return cl === 'all crops' || cl === targetCrop || targetCrop.includes(cl);
        });
      }
      if (!cropMatch) continue;

      if (landSize !== undefined && landSize !== null) {
        const { min_acres, max_acres } = scheme.landRequirements;
        if (min_acres !== undefined && landSize < min_acres) continue;
        if (max_acres !== undefined && landSize > max_acres) continue;
      }

      if (filter.category && scheme.category !== filter.category) {
        continue;
      }

      results.push({ ...scheme });
    }

    return results;
  }

  async search(query: string): Promise<GovernmentScheme[]> {
    const q = query.toLowerCase();
    const results: GovernmentScheme[] = [];

    for (const scheme of this.schemes.values()) {
      const match =
        scheme.name.toLowerCase().includes(q) ||
        (scheme.hindi_name && scheme.hindi_name.includes(q)) ||
        scheme.description.toLowerCase().includes(q) ||
        scheme.eligibleCrops.some((c) => c.toLowerCase().includes(q)) ||
        scheme.benefits.some((b) => b.toLowerCase().includes(q)) ||
        scheme.eligibility.some((e) => e.toLowerCase().includes(q));

      if (match) {
        results.push({ ...scheme });
      }
    }
    return results;
  }

  async addScheme(scheme: GovernmentScheme): Promise<GovernmentScheme> {
    this.schemes.set(scheme.id, { ...scheme });
    return { ...scheme };
  }
}
