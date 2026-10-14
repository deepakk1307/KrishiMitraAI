/**
 * Crop Advisory Routes
 */

import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { handleCropAnalyzeRequest, handleCropAskRequest } from '../controllers/cropController.ts';

export async function routeCrop(pathname: string, method: string, req: AuthenticatedRequest): Promise<any> {
  if ((pathname === '/api/crop/analyze' || pathname === '/api/crop/diagnose') && method === 'POST') {
    return handleCropAnalyzeRequest(req);
  }
  if (pathname === '/api/crop/ask' && method === 'POST') {
    return handleCropAskRequest(req);
  }
  return null;
}
