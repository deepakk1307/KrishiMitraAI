/**
 * Government Schemes Service & Eligibility Matcher
 */

import type { GovernmentScheme, SchemeCategory, SchemeMatchResult } from '../../models/schemes.ts';
import type { FarmerProfile } from '../../models/farmer.ts';
import { db } from '../../database/inMemoryDb.ts';
import { schemeRetriever } from '../rag/schemeRetriever.ts';

export class SchemeService {
  async findEligibleSchemes(farmer: FarmerProfile, category?: SchemeCategory): Promise<SchemeMatchResult[]> {
    const allSchemes = await db.scheme.filter({
      state: farmer.state,
      crop: farmer.crop,
      land_size: farmer.land_size,
      category,
    });

    return allSchemes.map((scheme) => {
      const matchReasons: string[] = [];

      if (scheme.state === 'All India' || scheme.state.toLowerCase() === farmer.state.toLowerCase()) {
        matchReasons.push(`Applicable in ${farmer.state}`);
      }

      if (scheme.eligibleCrops.some((c) => c.toLowerCase() === 'all crops' || c.toLowerCase() === farmer.crop.toLowerCase())) {
        matchReasons.push(`Covers ${farmer.crop}`);
      }

      const { min_acres, max_acres } = scheme.landRequirements;
      if (min_acres !== undefined || max_acres !== undefined) {
        matchReasons.push(`Qualifies for landholding (${farmer.land_size} ${farmer.land_unit})`);
      }

      return {
        scheme,
        isEligible: true,
        matchReasons,
        relevanceScore: 0.95,
      };
    });
  }

  async searchSchemesRAG(query: string, farmer?: FarmerProfile): Promise<any> {
    return schemeRetriever.retrieveSchemes(query, farmer);
  }
}

export const schemeService = new SchemeService();
