/**
 * Health Diagnostics Routes
 */

import { handleHealthCheck } from '../controllers/healthController.ts';

export async function routeHealth(pathname: string, method: string): Promise<any> {
  if (pathname === '/api/health' && method === 'GET') {
    return handleHealthCheck();
  }
  return null;
}
