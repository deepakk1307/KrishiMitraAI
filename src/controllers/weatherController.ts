/**
 * Weather Advisory Controller
 */

import { weatherService } from '../services/weather/weatherService.ts';
import { resolveFarmerContext, type AuthenticatedRequest } from '../middleware/auth.ts';

export async function handleGetWeatherRequest(req: AuthenticatedRequest): Promise<any> {
  const farmer = await resolveFarmerContext(req);
  const state = (req.query?.state as string) || farmer.state;
  const district = (req.query?.district as string) || farmer.district;

  const weatherData = await weatherService.getWeather(state, district);
  return weatherService.generateAdvisory(weatherData, farmer);
}
