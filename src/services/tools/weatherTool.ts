/**
 * Server-Side Tool: get_weather
 */

import { weatherService } from '../weather/weatherService.ts';
import type { FarmerProfile } from '../../models/farmer.ts';

export const getWeatherDeclaration = {
  name: 'get_weather',
  description: 'Retrieve real-time weather metrics, 5-day agro-meteorological forecast, and agricultural impact advisory for the farmer location.',
  parameters: {
    type: 'object',
    properties: {
      state: { type: 'string', description: 'Indian State e.g. Uttar Pradesh, Punjab, Madhya Pradesh' },
      district: { type: 'string', description: 'District name e.g. Lucknow, Indore, Ludhiana' },
      crop: { type: 'string', description: 'Target agricultural crop e.g. Wheat, Mustard, Paddy' },
    },
    required: ['district'],
  },
};

export async function executeGetWeather(args: { state?: string; district: string; crop?: string }, farmer?: FarmerProfile) {
  const state = args.state || farmer?.state || 'Uttar Pradesh';
  const district = args.district || farmer?.district || 'Lucknow';

  const weatherData = await weatherService.getWeather(state, district);
  return weatherService.generateAdvisory(weatherData, farmer || { crop: args.crop || 'Wheat' });
}
