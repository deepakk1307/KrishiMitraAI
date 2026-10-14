/**
 * Weather & Agro-Meteorological Domain Types
 */

export interface WeatherCoordinates {
  latitude: number;
  longitude: number;
  state: string;
  district: string;
}

export interface DailyForecast {
  date: string;
  day_name: string;
  max_temp_c: number;
  min_temp_c: number;
  rain_probability_percent: number;
  precipitation_mm: number;
  condition_text: string;
  agro_risk_level: 'low' | 'moderate' | 'high';
}

export interface WeatherData {
  location: {
    state: string;
    district: string;
    latitude: number;
    longitude: number;
  };
  current: {
    temp_c: number;
    feels_like_c: number;
    humidity_percent: number;
    rain_probability_percent: number;
    wind_kph: number;
    condition_text: string;
  };
  forecast: DailyForecast[];
  source: string;
}

export interface AgriculturalAdvisory {
  irrigation_advice: string;
  spraying_advice: string;
  drainage_advice: string;
  harvest_sowing_advice: string;
}

export interface WeatherAdvisoryResult {
  weather_data: WeatherData;
  crop_context?: {
    crop: string;
    location: string;
  };
  agricultural_advisory: AgriculturalAdvisory;
}
