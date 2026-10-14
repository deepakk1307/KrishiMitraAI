/**
 * Farmer Profile Routes
 */

import type { AuthenticatedRequest } from '../middleware/auth.ts';
import {
  handleGetFarmerProfile,
  handleUpdateFarmerProfile,
  handleListFarmers,
} from '../controllers/farmerController.ts';

export async function routeFarmer(pathname: string, method: string, req: AuthenticatedRequest): Promise<any> {
  if (pathname === '/api/farmer/profile' && method === 'GET') {
    return handleGetFarmerProfile(req);
  }
  if (pathname === '/api/farmer/profile' && method === 'PUT') {
    return handleUpdateFarmerProfile(req);
  }
  if (pathname === '/api/farmer/list' && method === 'GET') {
    return handleListFarmers();
  }
  return null;
}
