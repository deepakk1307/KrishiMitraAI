/**
 * Conversation Routes
 */

import type { AuthenticatedRequest } from '../middleware/auth.ts';
import {
  handleListConversations,
  handleGetConversation,
} from '../controllers/conversationController.ts';

export async function routeConversation(pathname: string, method: string, req: AuthenticatedRequest): Promise<any> {
  if (pathname === '/api/conversations' && method === 'GET') {
    return handleListConversations(req);
  }
  if (pathname.startsWith('/api/conversations/') && method === 'GET') {
    const convId = pathname.replace('/api/conversations/', '');
    return handleGetConversation(req, convId);
  }
  return null;
}
