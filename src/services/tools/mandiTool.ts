/**
 * Server-Side Tool: get_mandi_prices
 */

import { mandiService } from '../mandi/mandiService.ts';
import type { FarmerProfile } from '../../models/farmer.ts';

export const getMandiPricesDeclaration = {
  name: 'get_mandi_prices',
  description: 'Fetch verified APMC mandi prices, modal rates, and nearby market comparisons from official Indian Government open data.',
  parameters: {
    type: 'object',
    properties: {
      crop: { type: 'string', description: 'Commodity or crop name e.g. Wheat, Mustard, Paddy, Cotton' },
      state: { type: 'string', description: 'State name e.g. Uttar Pradesh, Punjab' },
      district: { type: 'string', description: 'District name e.g. Lucknow, Indore' },
    },
    required: ['crop'],
  },
};

export async function executeGetMandiPrices(args: { crop: string; state?: string; district?: string }, farmer?: FarmerProfile) {
  const crop = args.crop || farmer?.crop || 'Wheat';
  const state = args.state || farmer?.state || 'Uttar Pradesh';
  const district = args.district || farmer?.district || 'Lucknow';

  const prices = await mandiService.getMandiPrices({ crop, state, district });
  return mandiService.generateMarketAdvisory(prices, farmer);
}
