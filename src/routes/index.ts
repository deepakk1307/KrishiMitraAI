/**
 * Main Central Router Dispatcher
 */

import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { routeAuth } from './authRoutes.ts';
import { routeAssistant } from './assistantRoutes.ts';
import { routeCrop } from './cropRoutes.ts';
import { routeWeather } from './weatherRoutes.ts';
import { routeMandi } from './mandiRoutes.ts';
import { routeSchemes } from './schemesRoutes.ts';
import { routeFarmer } from './farmerRoutes.ts';
import { routeConversation } from './conversationRoutes.ts';
import { routeHealth } from './healthRoutes.ts';
import { NotFoundError } from '../utils/errors.ts';

export async function dispatchApiRoute(pathname: string, method: string, req: AuthenticatedRequest): Promise<any> {
  let result = await routeAuth(pathname, method, req);
  if (result !== null) return result;

  result = await routeAssistant(pathname, method, req);
  if (result !== null) return result;

  result = await routeCrop(pathname, method, req);
  if (result !== null) return result;

  result = await routeWeather(pathname, method, req);
  if (result !== null) return result;

  result = await routeMandi(pathname, method, req);
  if (result !== null) return result;

  result = await routeSchemes(pathname, method, req);
  if (result !== null) return result;

  result = await routeFarmer(pathname, method, req);
  if (result !== null) return result;

  result = await routeConversation(pathname, method, req);
  if (result !== null) return result;

  result = await routeHealth(pathname, method);
  if (result !== null) return result;

  throw new NotFoundError(`Route ${method} ${pathname}`);
}
