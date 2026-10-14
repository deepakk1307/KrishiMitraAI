/**
 * Government Schemes Controller
 */

import { schemeService } from '../services/schemes/schemeService.ts';
import { resolveFarmerContext, type AuthenticatedRequest } from '../middleware/auth.ts';

export async function handleGetSchemesRequest(req: AuthenticatedRequest): Promise<any> {
  const farmer = await resolveFarmerContext(req);
  const query = (req.query?.q as string) || (req.query?.query as string);
  const category = (req.query?.category as any);
  if (query && query.trim()) {
    return schemeService.searchSchemesRAG(query, farmer);
  }
  return schemeService.findEligibleSchemes(farmer, category);
}

export async function handleSchemeFilterRequest(req: AuthenticatedRequest): Promise<any> {
  const farmer = await resolveFarmerContext(req);
  const body = req.body || {};

  return schemeService.findEligibleSchemes(
    {
      ...farmer,
      state: body.state || farmer.state,
      crop: body.crop || farmer.crop,
      land_size: body.land_size !== undefined ? Number(body.land_size) : farmer.land_size,
    },
    body.category
  );
}

export async function handleSchemeRAGRequest(req: AuthenticatedRequest): Promise<any> {
  const farmer = await resolveFarmerContext(req);
  const query = req.body?.query || 'Government agricultural subsidies';

  return schemeService.searchSchemesRAG(query, farmer);
}
