/**
 * Authentication Routes
 */

import type { AuthenticatedRequest } from '../middleware/auth.ts';
import {
  handleRegisterRequest,
  handleLoginRequest,
  handleDemoLoginRequest,
  handleGetMeRequest,
} from '../controllers/authController.ts';

export async function routeAuth(pathname: string, method: string, req: AuthenticatedRequest): Promise<any> {
  if (pathname === '/api/auth/register' && method === 'POST') {
    return handleRegisterRequest(req);
  }
  if (pathname === '/api/auth/login' && method === 'POST') {
    return handleLoginRequest(req);
  }
  if (pathname === '/api/auth/demo-login' && method === 'POST') {
    return handleDemoLoginRequest(req);
  }
  if (pathname === '/api/auth/me' && method === 'GET') {
    return handleGetMeRequest(req);
  }
  return null;
}
