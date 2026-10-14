/**
 * Standardized Custom Domain & HTTP Error Classes
 */

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode = 500, code = 'InternalServerError', details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'ValidationError', details);
  }
}

export class AuthError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'Unauthorized');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NotFound');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again shortly.') {
    super(message, 429, 'RateLimitExceeded');
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: string) {
    super(
      `External service error (${service}): ${originalError || 'Service temporarily unreachable'}`,
      502,
      'BadGateway'
    );
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(
    message = 'Gemini Vision is unavailable because GEMINI_API_KEY is not configured.',
    code = 'GEMINI_VISION_UNAVAILABLE'
  ) {
    super(message, 503, code);
  }
}

