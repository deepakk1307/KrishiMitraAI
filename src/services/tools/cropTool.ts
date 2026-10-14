/**
 * Server-Side Tools: analyze_crop_image & answer_crop_question
 */

import { cropVisionService } from '../crop/cropVisionService.ts';
import type { FarmerProfile } from '../../models/farmer.ts';

export const analyzeCropImageDeclaration = {
  name: 'analyze_crop_image',
  description: 'Analyze an uploaded leaf or plant image using Multimodal Gemini Vision to diagnose diseases, chlorosis, and pest damage.',
  parameters: {
    type: 'object',
    properties: {
      image: { type: 'string', description: 'Base64 encoded image string (JPEG/PNG/WebP)' },
      crop: { type: 'string', description: 'Crop name e.g. Wheat, Paddy, Soybean' },
      question: { type: 'string', description: 'Specific observation or symptom query' },
    },
    required: ['image'],
  },
};

export const answerCropQuestionDeclaration = {
  name: 'answer_crop_question',
  description: 'Answer agronomic questions regarding crop management, fertilizer dosage, or pest treatment.',
  parameters: {
    type: 'object',
    properties: {
      crop: { type: 'string', description: 'Crop name' },
      question: { type: 'string', description: 'Agronomic or treatment question' },
    },
    required: ['crop', 'question'],
  },
};

export async function executeAnalyzeCropImage(args: { image: string; crop?: string; question?: string }, farmer?: FarmerProfile) {
  return cropVisionService.analyzeCropImage({
    image: args.image,
    cropHint: args.crop || null,
    question: args.question,
    farmerProfile: farmer,
  });
}

export async function executeAnswerCropQuestion(args: { crop: string; question: string }, farmer?: FarmerProfile) {
  return cropVisionService.answerCropQuestion({
    crop: args.crop || farmer?.crop || 'Wheat',
    question: args.question,
    farmerProfile: farmer,
  });
}
