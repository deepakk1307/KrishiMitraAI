/**
 * Conversation Controller
 */

import { db } from '../database/inMemoryDb.ts';
import { resolveFarmerContext, type AuthenticatedRequest } from '../middleware/auth.ts';
import { NotFoundError } from '../utils/errors.ts';

export async function handleListConversations(req: AuthenticatedRequest): Promise<any> {
  const farmer = await resolveFarmerContext(req);
  const list = await db.conversation.listByFarmer(farmer.id);
  return { conversations: list };
}

export async function handleGetConversation(req: AuthenticatedRequest, id: string): Promise<any> {
  const conv = await db.conversation.getById(id);
  if (!conv) {
    throw new NotFoundError(`Conversation with ID ${id}`);
  }
  return { conversation: conv };
}
