/**
 * Security & Input Validation Test Suite
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { executeNavigateToPage, WHITELISTED_ROUTES } from '../src/services/tools/navigationTool.ts';
import {
  validateAssistantRequest,
  validateCropAnalysisRequest,
  validateImagePayload,
} from '../src/middleware/validator.ts';
import { ValidationError } from '../src/utils/errors.ts';
import { Logger } from '../src/utils/logger.ts';

describe('Security & Input Validation Test Suite', () => {
  it('should strictly block unauthorized navigation routes', () => {
    const maliciousRoutes = [
      '/admin',
      '/api/farmer/delete',
      'javascript:alert(1)',
      'https://phishing-site.com',
      '/../../etc/passwd',
    ];

    for (const route of maliciousRoutes) {
      const result = executeNavigateToPage({ page: route });
      assert.equal(result.type, 'none');
      assert.equal(result.page, null);
    }
  });

  it('should accept only valid authorized routes', () => {
    for (const route of WHITELISTED_ROUTES) {
      const result = executeNavigateToPage({ page: route });
      assert.equal(result.type, 'navigate');
      assert.equal(result.page, route);
    }
  });

  it('should reject empty or missing assistant message payloads', () => {
    assert.throws(
      () => validateAssistantRequest({ message: '' }),
      (err: any) => err instanceof ValidationError
    );
    assert.throws(
      () => validateAssistantRequest({}),
      (err: any) => err instanceof ValidationError
    );
    assert.throws(
      () => validateAssistantRequest(null),
      (err: any) => err instanceof ValidationError
    );
  });

  it('should reject invalid image MIME types in crop analysis', () => {
    assert.throws(
      () => validateImagePayload('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
      (err: any) => err instanceof ValidationError && err.message.includes('Unsupported image format')
    );
  });

  it('should reject oversized image payloads exceeding 10MB', () => {
    const oversizedBase64 = 'a'.repeat(15 * 1024 * 1024);
    assert.throws(
      () => validateCropAnalysisRequest({ image: oversizedBase64 }),
      (err: any) => err instanceof ValidationError && err.message.includes('exceeds maximum limit')
    );
  });

  it('should sanitize API keys and internal stack traces from error responses', () => {
    const logger = new Logger();
    const mockApiKey = 'AIzaSyA123456789012345678901234567890';
    const rawError = new Error(`Database connection failed at key=${mockApiKey}`);

    let loggedOutput = '';
    const origError = console.error;
    console.error = (msg: string) => {
      loggedOutput = msg;
    };

    logger.error('API Request Error:', { error: rawError.message });
    console.error = origError;

    assert.ok(!loggedOutput.includes('123456789012345678901234567890'));
    assert.ok(loggedOutput.includes('[REDACTED]'));
  });
});
