/**
 * Assistant Controller
 */

import { assistantOrchestrator } from '../services/ai/assistantOrchestrator.ts';
import { validateAssistantRequest } from '../middleware/validator.ts';
import { resolveFarmerContext, type AuthenticatedRequest } from '../middleware/auth.ts';

export async function handleAssistantRequest(req: AuthenticatedRequest): Promise<any> {
  const validatedBody = validateAssistantRequest(req.body);
  const farmer = await resolveFarmerContext(req);

  return assistantOrchestrator.processRequest({
    message: validatedBody.message,
    conversationId: validatedBody.conversationId,
    farmerId: farmer.id,
    pageContext: validatedBody.pageContext,
    image: validatedBody.image,
  });
}
