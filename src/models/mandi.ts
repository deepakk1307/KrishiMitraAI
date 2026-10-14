/**
 * Mandi & Market Intelligence Types
 */

export interface MandiQuery {
  crop: string;
  state?: string;
  district?: string;
}

export interface NearbyMandiPrice {
  mandi_name: string;
  district: string;
  distance_km: number;
  modal_price: number;
  min_price?: number;
  max_price?: number;
  last_updated?: string;
}

export interface MandiPriceRecord {
  commodity?: string;
  crop: string;
  variety: string;
  state: string;
  district: string;
  market?: string;
  primary_mandi: string;
  current_price: number;
  modal_price: number;
  min_price: number;
  max_price: number;
  previous_price?: number;
  price_change?: number;
  trend?: 'rising' | 'falling' | 'stable';
  arrival_volume_tons?: number;
  arrival_date?: string;
  msp_declared?: number;
  nearby_mandis: NearbyMandiPrice[];
  data_timestamp: string;
  source: string;
  is_available: boolean;
  unavailable_reason?: string;
  cached?: boolean;
}

export interface MandiMarketAnalysis {
  is_available?: boolean;
  trend_summary: string;
  selling_recommendation: 'favorable_time_to_sell' | 'hold_if_storage_available' | 'neutral' | 'data_unavailable';
  msp_comparison: string;
  best_nearby_market?: string;
  advice: string;
  caution: string;
}

export interface MandiIntelligenceResult {
  mandi_data: MandiPriceRecord;
  market_analysis: MandiMarketAnalysis;
}
