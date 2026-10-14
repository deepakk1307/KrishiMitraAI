/**
 * Assistant Routes
 */

import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { handleAssistantRequest } from '../controllers/assistantController.ts';

export async function routeAssistant(pathname: string, method: string, req: AuthenticatedRequest): Promise<any> {
  if (pathname === '/api/assistant' && method === 'POST') {
    return handleAssistantRequest(req);
  }
  return null;
}
