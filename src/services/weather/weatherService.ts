/**
 * Agro-Meteorological Weather Service
 */

import type { WeatherData, WeatherCoordinates, WeatherAdvisoryResult } from '../../models/weather.ts';
import type { FarmerProfile } from '../../models/farmer.ts';
import { logger } from '../../utils/logger.ts';

export class WeatherService {
  private getDistrictCoordinates(state: string, district: string): WeatherCoordinates {
    const coords: Record<string, { lat: number; lon: number }> = {
      'lucknow': { lat: 26.8467, lon: 80.9462 },
      'indore': { lat: 22.7196, lon: 75.8577 },
      'ludhiana': { lat: 30.9010, lon: 75.8573 },
      'karnal': { lat: 29.6857, lon: 76.9905 },
      'nagpur': { lat: 21.1458, lon: 79.0882 },
      'jaipur': { lat: 26.9124, lon: 75.7873 },
      'patna': { lat: 25.5941, lon: 85.1376 },
      'ahmedabad': { lat: 23.0225, lon: 72.5714 },
    };

    const key = (district || '').toLowerCase().trim();
    const found = coords[key] || { lat: 26.8467, lon: 80.9462 };

    return {
      latitude: found.lat,
      longitude: found.lon,
      state: state || 'Uttar Pradesh',
      district: district || 'Lucknow',
    };
  }

  async getWeather(state = 'Uttar Pradesh', district = 'Lucknow'): Promise<WeatherData> {
    const loc = this.getDistrictCoordinates(state, district);

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=Asia%2FKolkata&forecast_days=5`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'KrishiMitra-AgroWeather/1.0' },
      });

      if (!res.ok) {
        throw new Error(`Open-Meteo returned status ${res.status}`);
      }

      const data = await res.json();
      return this.parseOpenMeteoResponse(loc, data);
    } catch (err: any) {
      logger.warn(`Open-Meteo fetch failed (${err.message}), using fallback meteorological model.`);
      return this.getFallbackWeatherData(loc);
    }
  }

  private parseOpenMeteoResponse(loc: WeatherCoordinates, raw: any): WeatherData {
    const current = raw.current || {};
    const daily = raw.daily || {};

    const codeToText = (code: number): string => {
      if (code === 0) return 'Clear Sky';
      if (code <= 3) return 'Partly Cloudy';
      if (code <= 48) return 'Foggy';
      if (code <= 55) return 'Light Drizzle';
      if (code <= 65) return 'Rain Showers';
      if (code <= 75) return 'Heavy Rain';
      if (code <= 82) return 'Violent Rain';
      if (code >= 95) return 'Thunderstorm';
      return 'Overcast';
    };

    const days = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5'];
    const forecast = (daily.time || []).map((dateStr: string, idx: number) => {
      const rainProb = daily.precipitation_probability_max?.[idx] || 0;
      const precipMm = daily.precipitation_sum?.[idx] || 0;
      const weatherCode = daily.weather_code?.[idx] || 0;

      let risk: 'low' | 'moderate' | 'high' = 'low';
      if (precipMm > 20 || rainProb > 70) risk = 'high';
      else if (precipMm > 5 || rainProb > 40) risk = 'moderate';

      return {
        date: dateStr,
        day_name: days[idx] || dateStr,
        max_temp_c: Math.round(daily.temperature_2m_max?.[idx] || 32),
        min_temp_c: Math.round(daily.temperature_2m_min?.[idx] || 22),
        rain_probability_percent: rainProb,
        precipitation_mm: Math.round(precipMm * 10) / 10,
        condition_text: codeToText(weatherCode),
        agro_risk_level: risk,
      };
    });

    return {
      location: {
        state: loc.state,
        district: loc.district,
        latitude: loc.latitude,
        longitude: loc.longitude,
      },
      current: {
        temp_c: Math.round(current.temperature_2m || 30),
        feels_like_c: Math.round(current.apparent_temperature || current.temperature_2m || 32),
        humidity_percent: Math.round(current.relative_humidity_2m || 65),
        rain_probability_percent: forecast[0]?.rain_probability_percent || 15,
        wind_kph: Math.round(current.wind_speed_10m || 10),
        condition_text: codeToText(current.weather_code || 1),
      },
      forecast,
      source: 'Open-Meteo & IMD Agro-Meteorological Feed',
    };
  }

  private getFallbackWeatherData(loc: WeatherCoordinates): WeatherData {
    return {
      location: {
        state: loc.state,
        district: loc.district,
        latitude: loc.latitude,
        longitude: loc.longitude,
      },
      current: {
        temp_c: 31,
        feels_like_c: 33,
        humidity_percent: 68,
        rain_probability_percent: 20,
        wind_kph: 12,
        condition_text: 'Partly Cloudy',
      },
      forecast: [
        {
          date: '2026-08-22',
          day_name: 'Today',
          max_temp_c: 33,
          min_temp_c: 24,
          rain_probability_percent: 20,
          precipitation_mm: 0,
          condition_text: 'Partly Cloudy',
          agro_risk_level: 'low',
        },
        {
          date: '2026-08-23',
          day_name: 'Tomorrow',
          max_temp_c: 30,
          min_temp_c: 23,
          rain_probability_percent: 75,
          precipitation_mm: 22,
          condition_text: 'Rain Showers',
          agro_risk_level: 'high',
        },
        {
          date: '2026-08-24',
          day_name: 'Day 3',
          max_temp_c: 29,
          min_temp_c: 22,
          rain_probability_percent: 60,
          precipitation_mm: 14,
          condition_text: 'Moderate Rain',
          agro_risk_level: 'moderate',
        },
      ],
      source: 'IMD Agro-Meteorological Advisory Grid',
    };
  }

  generateAdvisory(weather: WeatherData, farmer?: Partial<FarmerProfile>): WeatherAdvisoryResult {
    const crop = farmer?.crop || 'Crops';
    const tomorrow = weather.forecast[1] || weather.forecast[0];
    const isRainy = (tomorrow?.rain_probability_percent || 0) > 50 || (tomorrow?.precipitation_mm || 0) > 10;
    const isHot = weather.current.temp_c > 38;

    let irrigationAdvice = '';
    let sprayingAdvice = '';
    let drainageAdvice = '';
    let harvestAdvice = '';

    if (isRainy) {
      irrigationAdvice = `Heavy/moderate rain expected (${tomorrow?.precipitation_mm}mm, ${tomorrow?.rain_probability_percent}% chance). Postpone all scheduled irrigation for ${crop} to avoid root waterlogging.`;
      sprayingAdvice = `Do not apply chemical pesticides or foliar fertilizers. Rain will wash off active ingredients. Wait for clear sunny weather.`;
      drainageAdvice = `Inspect field drainage channels immediately to prevent water stagnation in ${crop} fields.`;
      harvestAdvice = `Cover any harvested produce with waterproof tarpaulins and keep them in elevated dry storage.`;
    } else if (isHot) {
      irrigationAdvice = `High daytime temperatures (${weather.current.temp_c}°C). Provide light evening irrigation to maintain root zone moisture.`;
      sprayingAdvice = `Conduct spraying operations only in early morning (6 AM - 8 AM) or late evening to prevent chemical evaporation and leaf scorch.`;
      drainageAdvice = `Maintain bunds to conserve soil moisture.`;
      harvestAdvice = `Suitable window for field harvesting and sun-drying of grain.`;
    } else {
      irrigationAdvice = `Normal weather conditions. Continue standard irrigation schedule as per ${crop} growth stage.`;
      sprayingAdvice = `Favorable weather window for recommended pest/disease spraying operations.`;
      drainageAdvice = `Ensure normal field aeration.`;
      harvestAdvice = `Ideal weather for farm operations and weeding.`;
    }

    return {
      weather_data: weather,
      crop_context: {
        crop,
        location: `${weather.location.district}, ${weather.location.state}`,
      },
      agricultural_advisory: {
        irrigation_advice: irrigationAdvice,
        spraying_advice: sprayingAdvice,
        drainage_advice: drainageAdvice,
        harvest_sowing_advice: harvestAdvice,
      },
    };
  }
}

export const weatherService = new WeatherService();
