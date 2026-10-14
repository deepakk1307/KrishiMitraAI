/**
 * Central AI Assistant & Intent Types
 */

export type AssistantIntent = 'weather' | 'crop' | 'mandi' | 'schemes' | 'general';

export type WhitelistedRoute =
  | '/home'
  | '/weather-advisory'
  | '/crop-advisory'
  | '/mandi-intelligence'
  | '/scheme-finder';

export interface ProposedNavigationAction {
  type: 'navigate' | 'none';
  page: WhitelistedRoute | null;
  reason?: string;
}

export interface AssistantRequest {
  message: string;
  conversationId?: string;
  farmerId?: string;
  pageContext?: string;
  image?: string;
}

export interface AssistantResponse {
  message: string;
  intent: AssistantIntent;
  action: ProposedNavigationAction;
  data?: Record<string, any>;
  conversationId: string;
  timestamp: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  farmerId?: string;
  role: 'farmer' | 'assistant' | 'system';
  content: string;
  intent?: AssistantIntent;
  action?: ProposedNavigationAction;
  data?: Record<string, any>;
  timestamp: string;
}

export interface Conversation {
  id: string;
  farmerId: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}
