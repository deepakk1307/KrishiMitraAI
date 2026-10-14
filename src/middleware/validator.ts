/**
 * Request Payload Validation & Sanitization Middleware
 */

import { ValidationError } from '../utils/errors.ts';

export function validateAssistantRequest(body: any): {
  message: string;
  conversationId?: string;
  pageContext?: string;
  image?: string;
} {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be a valid JSON object');
  }

  if (!body.message || typeof body.message !== 'string' || !body.message.trim()) {
    throw new ValidationError('Field "message" is required and must be a non-empty string');
  }

  if (body.message.length > 2000) {
    throw new ValidationError('Message length exceeds maximum allowable limit of 2000 characters');
  }

  let sanitizedImage: string | undefined;
  if (body.image) {
    sanitizedImage = validateImagePayload(body.image);
  }

  return {
    message: body.message.trim(),
    conversationId: body.conversationId ? String(body.conversationId) : undefined,
    pageContext: body.pageContext ? String(body.pageContext) : undefined,
    image: sanitizedImage,
  };
}

export function validateCropAnalysisRequest(body: any): {
  image: string;
  question?: string;
  cropHint?: string;
} {
  if (!body || !body.image) {
    throw new ValidationError('Field "image" (base64 string) is required for crop leaf analysis');
  }

  const validatedImage = validateImagePayload(body.image);
  const crop = body.cropHint || body.crop;

  return {
    image: validatedImage,
    question: body.question ? String(body.question).trim() : undefined,
    cropHint: crop ? String(crop).trim() : undefined,
  };
}

export function validateImagePayload(rawImage: string): string {
  if (typeof rawImage !== 'string' || !rawImage.trim()) {
    throw new ValidationError('Image payload must be a non-empty string');
  }

  const base64Data = rawImage.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
  const approximateSizeBytes = (base64Data.length * 3) / 4;

  if (approximateSizeBytes > 10 * 1024 * 1024) {
    throw new ValidationError('Image size exceeds maximum limit of 10MB');
  }

  if (rawImage.startsWith('data:')) {
    const validMimes = ['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/webp'];
    const hasValidMime = validMimes.some((m) => rawImage.startsWith(m));
    if (!hasValidMime) {
      throw new ValidationError('Unsupported image format. Allowed formats: JPEG, PNG, WebP');
    }
  }

  return rawImage;
}

export function validateFarmerProfileUpdate(body: any): Record<string, any> {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Update payload must be a JSON object');
  }

  const allowedFields = ['name', 'state', 'district', 'village', 'crop', 'secondary_crops', 'language', 'land_size', 'land_unit', 'soil_type', 'irrigation_source', 'phone'];
  const sanitized: Record<string, any> = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === 'land_size') {
        const size = Number(body[field]);
        if (isNaN(size) || size <= 0) {
          throw new ValidationError('land_size must be a positive number');
        }
        sanitized[field] = size;
      } else {
        sanitized[field] = body[field];
      }
    }
  }

  return sanitized;
}
