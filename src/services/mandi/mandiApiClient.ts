/**
 * Official Government Mandi API Client
 * Integrated with data.gov.in / Agmarknet Daily Mandi Price API
 */

import type { MandiPriceRecord, MandiQuery, NearbyMandiPrice } from '../../models/mandi.ts';
import { logger } from '../../utils/logger.ts';
import { config } from '../../config/index.ts';

const GOVT_AGMARKNET_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const GOVT_MANDI_API_BASE = 'https://api.data.gov.in/resource';

const OFFICIAL_MSP_BENCHMARKS: Record<string, number> = {
  wheat: 2275,
  paddy: 2300,
  rice: 2300,
  mustard: 5650,
  cotton: 7121,
  soybean: 4892,
  gram: 5440,
  maize: 2090,
  sugarcane: 315,
  potato: 0,
  onion: 0,
  tomato: 0,
};

const COMMODITY_SYNONYM_MAP: Record<string, string> = {
  wheat: 'Wheat',
  gehu: 'Wheat',
  gehun: 'Wheat',
  paddy: 'Paddy(Dhan)',
  dhan: 'Paddy(Dhan)',
  rice: 'Rice',
  chawal: 'Rice',
  mustard: 'Mustard',
  sarson: 'Mustard',
  cotton: 'Cotton',
  kapas: 'Cotton',
  soybean: 'Soyabean',
  soyabean: 'Soyabean',
  gram: 'Bengal Gram(Gram)(Whole)',
  chana: 'Bengal Gram(Gram)(Whole)',
  maize: 'Maize',
  makka: 'Maize',
  sugarcane: 'Sugarcane',
  ganna: 'Sugarcane',
  potato: 'Potato',
  aloo: 'Potato',
  onion: 'Onion',
  pyaz: 'Onion',
  tomato: 'Tomato',
  tamatar: 'Tomato',
};

export class MandiApiClient {
  private apiKey: string;

  constructor(apiKey = config.mandiApiKey) {
    this.apiKey = apiKey;
  }

  normalizeCommodity(cropQuery: string): string {
    const clean = (cropQuery || '').toLowerCase().trim();
    return COMMODITY_SYNONYM_MAP[clean] || cropQuery;
  }

  getMspBenchmark(commodity: string): number {
    const key = (commodity || '').toLowerCase().trim();
    return OFFICIAL_MSP_BENCHMARKS[key] || 0;
  }

  async fetchMandiData(query: MandiQuery): Promise<MandiPriceRecord> {
    const normalizedCommodity = this.normalizeCommodity(query.crop);
    const state = query.state || 'Uttar Pradesh';
    const district = query.district || 'Lucknow';
    const msp = this.getMspBenchmark(query.crop);

    if (!this.apiKey) {
      logger.warn('MANDI_API_KEY not configured. Adhering to Zero Price Fabrication rule.');
      return this.createUnavailableRecord(
        query.crop,
        state,
        district,
        msp,
        'Government Mandi API key (MANDI_API_KEY) is not configured on the server.'
      );
    }

    try {
      const url = new URL(`${GOVT_MANDI_API_BASE}/${GOVT_AGMARKNET_RESOURCE_ID}`);
      url.searchParams.set('api-key', this.apiKey);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '50');
      url.searchParams.set('filters[state]', state);
      url.searchParams.set('filters[district]', district);

      const res = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KrishiMitra-AgroMarketClient/1.0',
        },
      });

      if (!res.ok) {
        throw new Error(`Government Mandi API returned HTTP error (${res.status}: ${res.statusText}).`);
      }

      const payload = await res.json();
      const rawRecords: any[] = payload.records || [];

      const commodityMatches = rawRecords.filter((r) => {
        const cName = (r.commodity || '').toLowerCase();
        const target = normalizedCommodity.toLowerCase();
        const rawCrop = query.crop.toLowerCase();
        return cName.includes(target) || cName.includes(rawCrop) || target.includes(cName);
      });

      if (commodityMatches.length === 0) {
        return this.createUnavailableRecord(
          query.crop,
          state,
          district,
          msp,
          `No active mandi arrivals reported for ${query.crop} in ${district}, ${state} for today.`
        );
      }

      return this.parseGovtRecords(query.crop, state, district, commodityMatches, msp);
    } catch (err: any) {
      logger.error('Failed to retrieve live mandi data from data.gov.in:', { error: err.message });
      return this.createUnavailableRecord(
        query.crop,
        state,
        district,
        msp,
        `Government market data source currently unreachable (${err.message}).`
      );
    }
  }

  private parseGovtRecords(
    crop: string,
    state: string,
    district: string,
    records: any[],
    msp: number
  ): MandiPriceRecord {
    const primary = records[0];
    const minPrice = parseFloat(primary.min_price) || 0;
    const maxPrice = parseFloat(primary.max_price) || 0;
    const modalPrice = parseFloat(primary.modal_price) || minPrice || maxPrice;

    const nearbyMandis: NearbyMandiPrice[] = [];
    for (let i = 1; i < records.length; i++) {
      const r = records[i];
      const mPrice = parseFloat(r.modal_price) || parseFloat(r.max_price) || 0;
      if (mPrice > 0) {
        nearbyMandis.push({
          mandi_name: `${r.market} APMC`,
          district: r.district || district,
          distance_km: 15 + i * 12,
          modal_price: mPrice,
          min_price: parseFloat(r.min_price) || undefined,
          max_price: parseFloat(r.max_price) || undefined,
          last_updated: new Date().toISOString(),
        });
      }
    }

    return {
      commodity: primary.commodity || crop,
      crop,
      variety: primary.variety || 'Standard / FAQ Grade',
      state: primary.state || state,
      district: primary.district || district,
      market: `${primary.market} APMC`,
      primary_mandi: `${primary.market} APMC`,
      current_price: modalPrice,
      modal_price: modalPrice,
      min_price: minPrice,
      max_price: maxPrice,
      arrival_date: primary.arrival_date || new Date().toLocaleDateString('en-GB'),
      msp_declared: msp,
      nearby_mandis: nearbyMandis,
      data_timestamp: new Date().toISOString(),
      source: 'data.gov.in / Agmarknet Daily Mandi Price API',
      is_available: true,
      cached: false,
    };
  }

  private createUnavailableRecord(
    crop: string,
    state: string,
    district: string,
    msp: number,
    reason: string
  ): MandiPriceRecord {
    return {
      commodity: crop,
      crop,
      variety: 'N/A',
      state,
      district,
      market: `${district} APMC Yard`,
      primary_mandi: `${district} APMC Yard`,
      current_price: 0,
      modal_price: 0,
      min_price: 0,
      max_price: 0,
      arrival_date: new Date().toLocaleDateString('en-GB'),
      msp_declared: msp,
      nearby_mandis: [],
      data_timestamp: new Date().toISOString(),
      source: 'data.gov.in / Agmarknet Daily Mandi API',
      is_available: false,
      unavailable_reason: reason,
      cached: false,
    };
  }
}

export const mandiApiClient = new MandiApiClient();
