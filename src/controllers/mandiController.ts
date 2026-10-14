/**
 * Mandi Intelligence Controller
 */

import { mandiService } from '../services/mandi/mandiService.ts';
import { db } from '../database/inMemoryDb.ts';
import { resolveFarmerContext, type AuthenticatedRequest } from '../middleware/auth.ts';

export async function handleGetMandiPricesRequest(req: AuthenticatedRequest): Promise<any> {
  const farmer = await resolveFarmerContext(req);
  const crop = (req.query?.crop as string) || farmer.crop || 'Wheat';
  const state = (req.query?.state as string) || farmer.state;
  const district = (req.query?.district as string) || farmer.district;

  const record = await mandiService.getMandiPrices({ crop, state, district });
  return mandiService.generateMarketAdvisory(record, farmer);
}

export async function handleGetMandiMetaRequest(): Promise<any> {
  const crops = await db.mandi.getAllCrops();
  const states = await db.mandi.getAllStates();
  return { crops, states };
}
