/**
 * Production Farmer Authentication Middleware
 */

import { authService } from '../services/auth/authService.ts';
import { db } from '../database/inMemoryDb.ts';
import type { FarmerProfile, AuthTokenPayload } from '../models/farmer.ts';
import { AuthError } from '../utils/errors.ts';

export interface AuthenticatedRequest {
  user?: AuthTokenPayload;
  farmer?: FarmerProfile;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
  query?: any;
  params?: any;
}

export async function resolveFarmerContext(req: AuthenticatedRequest): Promise<FarmerProfile> {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  let token: string | undefined;

  if (typeof authHeader === 'string' && authHeader.trim().startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    throw new AuthError('Authentication required. Please provide a valid Authorization: Bearer <token> header.');
  }

  const payload = authService.verifyJwtToken(token);

  if (!payload || !payload.farmerId) {
    throw new AuthError('Invalid authentication token payload.');
  }

  const profile = await db.farmer.getById(payload.farmerId);
  if (!profile) {
    throw new AuthError('Authenticated farmer profile not found in database.');
  }

  req.user = payload;
  req.farmer = profile;

  return profile;
}
