/**
 * Crop Advisory Controller
 */

import { cropVisionService } from '../services/crop/cropVisionService.ts';
import { geminiClient } from '../services/ai/geminiClient.ts';
import { validateCropAnalysisRequest } from '../middleware/validator.ts';
import { resolveFarmerContext, type AuthenticatedRequest } from '../middleware/auth.ts';
import { ServiceUnavailableError } from '../utils/errors.ts';

export async function handleCropAnalyzeRequest(req: AuthenticatedRequest): Promise<any> {
  if (!geminiClient.isLive()) {
    throw new ServiceUnavailableError(
      'Gemini Vision is unavailable because GEMINI_API_KEY is not configured.',
      'GEMINI_VISION_UNAVAILABLE'
    );
  }

  const validated = validateCropAnalysisRequest(req.body);
  const farmer = await resolveFarmerContext(req);

  return cropVisionService.analyzeCropImage({
    image: validated.image,
    question: validated.question,
    cropHint: validated.cropHint || null,
    farmerProfile: farmer,
  });
}

export async function handleCropAskRequest(req: AuthenticatedRequest): Promise<any> {
  const farmer = await resolveFarmerContext(req);
  const body = req.body || {};

  return cropVisionService.answerCropQuestion({
    crop: body.crop || farmer.crop || 'Wheat',
    question: body.question || 'General crop guidance',
    previousAnalysis: body.previousAnalysis,
    farmerProfile: farmer,
  });
}

