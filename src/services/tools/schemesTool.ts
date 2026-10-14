/**
 * Server-Side Tool: find_eligible_schemes
 */

import { schemeService } from '../schemes/schemeService.ts';
import type { FarmerProfile } from '../../models/farmer.ts';

export const findEligibleSchemesDeclaration = {
  name: 'find_eligible_schemes',
  description: 'Search grounded database of verified central and state government agricultural schemes (PM-KISAN, PMFBY, KCC, PKVY, etc.).',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search term e.g. insurance, subsidy, solar pump, loan' },
      state: { type: 'string', description: 'State name' },
      crop: { type: 'string', description: 'Target crop' },
      land_size: { type: 'number', description: 'Farmer landholding in acres' },
    },
    required: ['query'],
  },
};

export async function executeFindEligibleSchemes(args: { query: string; state?: string; crop?: string; land_size?: number }, farmer?: FarmerProfile) {
  const effectiveFarmer: FarmerProfile = {
    id: farmer?.id || 'farmer-temp',
    name: farmer?.name || 'Farmer',
    state: args.state || farmer?.state || 'All India',
    district: farmer?.district || 'Central District',
    language: farmer?.language || 'Hindi',
    land_size: args.land_size !== undefined ? Number(args.land_size) : farmer?.land_size || 2,
    land_unit: farmer?.land_unit || 'acres',
    crop: args.crop || farmer?.crop || 'Wheat',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return schemeService.searchSchemesRAG(args.query, effectiveFarmer);
}
