/**
 * Government Schemes & RAG Domain Types
 */

export type SchemeCategory =
  | 'Income Support'
  | 'Crop Insurance'
  | 'Credit & Loan'
  | 'Organic Farming'
  | 'Irrigation Subsidy'
  | 'Farm Mechanization'
  | 'Debt Relief'
  | 'Soil Health';

export interface LandholdingRequirement {
  min_acres?: number;
  max_acres?: number;
  category?: 'marginal' | 'small' | 'medium' | 'large' | 'all';
}

export interface GovernmentScheme {
  id: string;
  name: string;
  hindi_name?: string;
  category: SchemeCategory;
  description: string;
  state: string;
  eligibleCrops: string[];
  landRequirements: LandholdingRequirement;
  benefits: string[];
  eligibility: string[];
  documents: string[];
  officialSource: string;
  applicationProcess?: string;
}

export interface SchemeEligibilityFilter {
  state?: string;
  crop?: string;
  land_size?: number;
  category?: SchemeCategory;
}

export interface SchemeMatchResult {
  scheme: GovernmentScheme;
  isEligible: boolean;
  matchReasons: string[];
  relevanceScore?: number;
}
