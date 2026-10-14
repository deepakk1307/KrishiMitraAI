/**
 * Mandi Intelligence Routes
 */

import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { handleGetMandiPricesRequest, handleGetMandiMetaRequest } from '../controllers/mandiController.ts';

export async function routeMandi(pathname: string, method: string, req: AuthenticatedRequest): Promise<any> {
  if ((pathname === '/api/mandi' || pathname === '/api/mandi/prices') && method === 'GET') {
    return handleGetMandiPricesRequest(req);
  }
  if (pathname === '/api/mandi/meta' && method === 'GET') {
    return handleGetMandiMetaRequest();
  }
  return null;
}
