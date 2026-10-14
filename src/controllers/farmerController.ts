/**
 * Farmer Profile Controller
 */

import { db } from '../database/inMemoryDb.ts';
import { resolveFarmerContext, type AuthenticatedRequest } from '../middleware/auth.ts';
import { validateFarmerProfileUpdate } from '../middleware/validator.ts';
import { NotFoundError } from '../utils/errors.ts';

export async function handleGetFarmerProfile(req: AuthenticatedRequest): Promise<any> {
  const farmer = await resolveFarmerContext(req);
  return { farmer };
}

export async function handleUpdateFarmerProfile(req: AuthenticatedRequest): Promise<any> {
  const farmer = await resolveFarmerContext(req);
  const validatedUpdates = validateFarmerProfileUpdate(req.body);

  const updated = await db.farmer.update(farmer.id, validatedUpdates);
  if (!updated) {
    throw new NotFoundError('Farmer profile');
  }

  return { farmer: updated };
}

export async function handleListFarmers(): Promise<any> {
  const farmers = await db.farmer.listAll();
  return { farmers };
}
