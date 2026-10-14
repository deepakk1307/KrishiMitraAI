/**
 * Mandi Intelligence In-Memory TTL Cache Engine
 */

import type { MandiPriceRecord } from '../../models/mandi.ts';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  isStale: boolean;
}

export class MandiCache {
  private cache: Map<string, CacheEntry<MandiPriceRecord>> = new Map();
  private defaultTtlMs: number;

  constructor(ttlMinutes = 60) {
    this.defaultTtlMs = ttlMinutes * 60 * 1000;
  }

  private generateKey(commodity: string, state: string, district: string): string {
    return `${(commodity || '').toLowerCase().trim()}::${(state || 'all').toLowerCase().trim()}::${(district || 'all').toLowerCase().trim()}`;
  }

  get(commodity: string, state: string, district: string): CacheEntry<MandiPriceRecord> | null {
    const key = this.generateKey(commodity, state, district);
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const isStale = now > entry.expiresAt;

    return {
      ...entry,
      isStale,
    };
  }

  set(commodity: string, state: string, district: string, data: MandiPriceRecord, ttlMs?: number): void {
    const key = this.generateKey(commodity, state, district);
    const now = Date.now();
    const expiry = now + (ttlMs || this.defaultTtlMs);

    this.cache.set(key, {
      data: {
        ...data,
        cached: true,
      },
      timestamp: now,
      expiresAt: expiry,
      isStale: false,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const mandiCache = new MandiCache(60);
