/**
 * Mandi & Agricultural Market Intelligence Service
 */

import type { MandiPriceRecord, MandiIntelligenceResult, MandiQuery } from '../../models/mandi.ts';
import type { FarmerProfile } from '../../models/farmer.ts';
import { mandiApiClient, MandiApiClient } from './mandiApiClient.ts';
import { mandiCache, MandiCache } from './mandiCache.ts';

export class MandiService {
  private client: MandiApiClient;
  private cache: MandiCache;

  constructor(client: MandiApiClient = mandiApiClient, cache: MandiCache = mandiCache) {
    this.client = client;
    this.cache = cache;
  }

  async getMandiPrices(query: MandiQuery): Promise<MandiPriceRecord> {
    const crop = query.crop || 'Wheat';
    const state = query.state || 'Uttar Pradesh';
    const district = query.district || 'Lucknow';

    const cachedEntry = this.cache.get(crop, state, district);
    if (cachedEntry && !cachedEntry.isStale && cachedEntry.data.is_available) {
      return {
        ...cachedEntry.data,
        cached: true,
      };
    }

    const liveRecord = await this.client.fetchMandiData({ crop, state, district });

    if (liveRecord.is_available) {
      this.cache.set(crop, state, district, liveRecord);
    }

    return liveRecord;
  }

  generateMarketAdvisory(mandiData: MandiPriceRecord, farmer?: Partial<FarmerProfile>): MandiIntelligenceResult {
    const crop = mandiData.crop || 'Crop';
    const msp = mandiData.msp_declared || 0;

    if (!mandiData.is_available) {
      const reasonText = mandiData.unavailable_reason || 'Live government market data currently unavailable.';
      const mspText =
        msp > 0
          ? `Government MSP benchmark for ${crop} is ₹${msp}/quintal (Official CACP reference).`
          : `Government MSP benchmark is not applicable for ${crop}.`;

      return {
        mandi_data: mandiData,
        market_analysis: {
          is_available: false,
          trend_summary: `Live APMC market rates are currently unavailable for ${crop} in ${mandiData.district}, ${mandiData.state}.`,
          selling_recommendation: 'data_unavailable',
          msp_comparison: mspText,
          advice: `${reasonText} Live market data is currently unavailable. Please check with your local APMC Mandi Secretary or visit the nearest mandi yard for today's physical spot rates.`,
          caution: 'Prices are never fabricated or estimated to ensure transparency and prevent misleading trade decisions.',
        },
      };
    }

    const currentPrice = mandiData.modal_price || mandiData.current_price;
    const minPrice = mandiData.min_price || currentPrice;
    const maxPrice = mandiData.max_price || currentPrice;

    let trendSummary = `Live modal rate for ${crop} at ${mandiData.market || mandiData.primary_mandi} is ₹${currentPrice}/quintal (Range: ₹${minPrice} - ₹${maxPrice}/q).`;

    let sellingRecommendation: 'favorable_time_to_sell' | 'hold_if_storage_available' | 'neutral' = 'neutral';
    let advice = '';

    if (msp > 0 && currentPrice >= msp) {
      sellingRecommendation = 'favorable_time_to_sell';
      advice = `Today's modal rate of ₹${currentPrice}/q is above the Govt MSP (₹${msp}/q). Market demand in ${mandiData.district} is strong. If your ${crop} is properly dried (<12% moisture), current rates are favorable.`;
    } else if (msp > 0 && currentPrice < msp) {
      sellingRecommendation = 'hold_if_storage_available';
      advice = `Current open market price (₹${currentPrice}/q) is below the Govt MSP (₹${msp}/q). Consider registering for Government procurement centers (e-Procurement/FCI) or holding produce in a certified warehouse if available.`;
    } else {
      sellingRecommendation = 'neutral';
      advice = `Current modal price is ₹${currentPrice}/quintal at ${mandiData.market}. Ensure your produce meets standard grade quality and low moisture before bringing it to the APMC yard.`;
    }

    let mspComparison = '';
    if (msp > 0) {
      if (currentPrice >= msp) {
        mspComparison = `Current mandi modal price (₹${currentPrice}/q) is ₹${currentPrice - msp}/q above Government MSP (₹${msp}/q).`;
      } else {
        mspComparison = `Current mandi modal price (₹${currentPrice}/q) is ₹${msp - currentPrice}/q below Government MSP (₹${msp}/q).`;
      }
    } else {
      mspComparison = `No statutory MSP declared for ${crop}. Rates are determined by open APMC competitive bidding.`;
    }

    let bestNearbyMarket: string | undefined;
    if (mandiData.nearby_mandis && mandiData.nearby_mandis.length > 0) {
      const sorted = [...mandiData.nearby_mandis].sort((a, b) => b.modal_price - a.modal_price);
      const top = sorted[0];
      if (top && top.modal_price > currentPrice) {
        const extra = top.modal_price - currentPrice;
        bestNearbyMarket = `${top.mandi_name} (${top.district}, ~${top.distance_km} km away) is reporting ₹${top.modal_price}/quintal (+₹${extra}/q higher). Factor in transportation costs before dispatching.`;
      }
    }

    return {
      mandi_data: mandiData,
      market_analysis: {
        is_available: true,
        trend_summary: trendSummary,
        selling_recommendation: sellingRecommendation,
        msp_comparison: mspComparison,
        best_nearby_market: bestNearbyMarket,
        advice,
        caution: 'Market prices fluctuate based on daily arrivals, moisture content, and produce grade. These insights are advisory and sourced from official government feeds.',
      },
    };
  }
}

export const mandiService = new MandiService();
