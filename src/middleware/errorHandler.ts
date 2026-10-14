/**
 * Global Error Handling Middleware
 */

import { AppError } from '../utils/errors.ts';
import { logger } from '../utils/logger.ts';

export interface FormattedErrorResponse {
  statusCode: number;
  body: {
    error: {
      code: string;
      message: string;
      details?: any;
    };
    timestamp: string;
  };
}

export function errorHandler(err: any): FormattedErrorResponse {
  const timestamp = new Date().toISOString();

  if (err instanceof AppError) {
    logger.warn(`Handled AppError (${err.code}): ${err.message}`);
    return {
      statusCode: err.statusCode,
      body: {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
        timestamp,
      },
    };
  }

  logger.error(`Unhandled API Error: ${err?.message || 'Unknown error'}`, { stack: err?.stack });

  return {
    statusCode: 500,
    body: {
      error: {
        code: 'InternalServerError',
        message: 'An unexpected internal error occurred. Please retry shortly.',
      },
      timestamp,
    },
  };
}
