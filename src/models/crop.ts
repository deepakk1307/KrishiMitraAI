/**
 * Crop Doctor & Multimodal Vision Types
 */

export type IssueCategory =
  | 'fungal'
  | 'bacterial'
  | 'viral'
  | 'pest'
  | 'nutrient_deficiency'
  | 'environmental'
  | 'healthy'
  | 'unknown';

export interface CropAnalysisRequest {
  image: string;
  question?: string;
  cropHint?: string | null;
  farmerProfile?: any;
}

export interface CropValidationResult {
  imageType: 'plant' | 'non_plant' | 'unclear';
  containsCrop: boolean;
  cropName: string | null;
  confidence: number;
  reason?: string;
}

export interface CropInvalidImageResult {
  status: 'invalid_image' | 'unclear';
  imageType: 'plant' | 'non_plant' | 'unclear';
  crop: null;
  possibleIssue: null;
  message: string;
  message_en?: string;
  message_hi?: string;
  confidence?: 'high' | 'moderate' | 'low';
  observations?: string[];
  recommendedActions?: string[];
  prevention?: string[];
}

export interface CropAnalysisFailedResult {
  status: 'analysis_failed';
  errorCode?: string;
  debugMessage?: string;
  imageType?: 'unclear' | 'non_plant' | 'plant';
  crop?: null;
  possibleIssue?: null;
  message: string;
  message_en?: string;
  message_hi?: string;
}

export interface CropSuccessAnalysisResult {
  status: 'success';
  imageType: 'plant';
  crop: string;
  possibleIssue: string;
  disease_name?: string;
  scientificName?: string | null;
  issueCategory?: IssueCategory;
  confidence: 'high' | 'moderate' | 'low';
  observations: string[];
  recommendedActions: string[];
  remedies?: string[];
  prevention: string[];
  fertilizerOrChemicalRecommendation?: string[];
  organicAlternative?: string[];
  message?: string;
  warning?: string;
}

export type CropAnalysisResult =
  | CropSuccessAnalysisResult
  | CropInvalidImageResult
  | CropAnalysisFailedResult;


