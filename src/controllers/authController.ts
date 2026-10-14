/**
 * Authentication Controller
 */

import { authService } from '../services/auth/authService.ts';
import { resolveFarmerContext, type AuthenticatedRequest } from '../middleware/auth.ts';

export async function handleRegisterRequest(req: AuthenticatedRequest): Promise<any> {
  return authService.register(req.body || {});
}

export async function handleLoginRequest(req: AuthenticatedRequest): Promise<any> {
  return authService.login(req.body || {});
}

export async function handleDemoLoginRequest(req: AuthenticatedRequest): Promise<any> {
  const demoId = req.body?.demoId || 'farmer-ramesh-kumar';
  return authService.demoLogin(demoId);
}

export async function handleGetMeRequest(req: AuthenticatedRequest): Promise<any> {
  const farmer = await resolveFarmerContext(req);
  return {
    user: req.user,
    farmer,
  };
}
