/**
 * Government Schemes Routes
 */

import type { AuthenticatedRequest } from '../middleware/auth.ts';
import {
  handleGetSchemesRequest,
  handleSchemeFilterRequest,
  handleSchemeRAGRequest,
} from '../controllers/schemesController.ts';

export async function routeSchemes(pathname: string, method: string, req: AuthenticatedRequest): Promise<any> {
  if ((pathname === '/api/schemes' || pathname === '/api/schemes/search') && method === 'GET') {
    return handleGetSchemesRequest(req);
  }
  if (pathname === '/api/schemes/filter' && method === 'POST') {
    return handleSchemeFilterRequest(req);
  }
  if ((pathname === '/api/schemes/rag' || pathname === '/api/schemes/search') && method === 'POST') {
    return handleSchemeRAGRequest(req);
  }
  return null;
}
