/**
 * Weather Advisory Routes
 */

import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { handleGetWeatherRequest } from '../controllers/weatherController.ts';

export async function routeWeather(pathname: string, method: string, req: AuthenticatedRequest): Promise<any> {
  if (pathname === '/api/weather' && method === 'GET') {
    return handleGetWeatherRequest(req);
  }
  return null;
}
