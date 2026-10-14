/**
 * Conversation Repository (PostgreSQL & In-Memory implementations)
 */

import type { IConversationRepository } from '../database/dbInterface.ts';
import type { Conversation, ConversationMessage } from '../models/assistant.ts';
import { PostgresClient, pgClient } from '../database/postgresClient.ts';

export class PostgresConversationRepository implements IConversationRepository {
  private client: PostgresClient;

  constructor(client: PostgresClient = pgClient) {
    this.client = client;
  }

  async getById(id: string): Promise<Conversation | null> {
    const convRes = await this.client.query<any>(
      `SELECT id, farmer_id, title, created_at, updated_at FROM conversations WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (!convRes.rows || convRes.rows.length === 0) return null;
    const convRow = convRes.rows[0];

    const msgRes = await this.client.query<any>(
      `SELECT id, conversation_id, farmer_id, role, content, intent, action_type, action_page, action_reason, data_json, timestamp
       FROM messages WHERE conversation_id = $1 ORDER BY timestamp ASC`,
      [id]
    );

    const messages: ConversationMessage[] = (msgRes.rows || []).map((m: any) => ({
      id: m.id,
      conversationId: m.conversation_id,
      farmerId: m.farmer_id,
      role: m.role,
      content: m.content,
      intent: m.intent,
      action: m.action_type ? { type: m.action_type, page: m.action_page, reason: m.action_reason } : undefined,
      data: m.data_json ? (typeof m.data_json === 'string' ? JSON.parse(m.data_json) : m.data_json) : undefined,
      timestamp: m.timestamp,
    }));

    return {
      id: convRow.id,
      farmerId: convRow.farmer_id,
      title: convRow.title,
      messages,
      createdAt: convRow.created_at,
      updatedAt: convRow.updated_at,
    };
  }

  async listByFarmer(farmerId: string, limit = 20): Promise<Conversation[]> {
    const res = await this.client.query<any>(
      `SELECT id FROM conversations WHERE farmer_id = $1 ORDER BY updated_at DESC LIMIT $2`,
      [farmerId, limit]
    );
    const list: Conversation[] = [];
    for (const row of res.rows) {
      const conv = await this.getById(row.id);
      if (conv) list.push(conv);
    }
    return list;
  }

  async create(farmerId: string, title = 'KrishiMitra Advisory'): Promise<Conversation> {
    const id = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    await this.client.query(
      `INSERT INTO conversations (id, farmer_id, title, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`,
      [id, farmerId, title, now, now]
    );

    return {
      id,
      farmerId,
      title,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  async addMessage(
    conversationId: string,
    msg: Omit<ConversationMessage, 'id' | 'conversationId' | 'timestamp'>
  ): Promise<ConversationMessage> {
    let conv = await this.getById(conversationId);
    if (!conv) {
      conv = await this.create(msg.farmerId || 'farmer-ramesh-kumar');
      conversationId = conv.id;
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    await this.client.query(
      `INSERT INTO messages (id, conversation_id, farmer_id, role, content, intent, action_type, action_page, action_reason, data_json, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        messageId,
        conversationId,
        msg.farmerId || null,
        msg.role,
        msg.content,
        msg.intent || null,
        msg.action?.type || null,
        msg.action?.page || null,
        msg.action?.reason || null,
        msg.data ? JSON.stringify(msg.data) : null,
        now,
      ]
    );

    await this.client.query(`UPDATE conversations SET updated_at = $1 WHERE id = $2`, [now, conversationId]);

    return {
      ...msg,
      id: messageId,
      conversationId,
      timestamp: now,
    };
  }

  async getRecentMessages(conversationId: string, limit = 10): Promise<ConversationMessage[]> {
    const conv = await this.getById(conversationId);
    if (!conv) return [];
    return conv.messages.slice(-limit);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.client.query(`DELETE FROM conversations WHERE id = $1`, [id]);
    return res.rowCount > 0;
  }
}

export class InMemoryConversationRepository implements IConversationRepository {
  private conversations: Map<string, Conversation> = new Map();

  async getById(id: string): Promise<Conversation | null> {
    return this.conversations.get(id) || null;
  }

  async listByFarmer(farmerId: string, limit = 20): Promise<Conversation[]> {
    const list: Conversation[] = [];
    for (const conv of this.conversations.values()) {
      if (conv.farmerId === farmerId) {
        list.push(conv);
      }
    }
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list.slice(0, limit);
  }

  async create(farmerId: string, title = 'KrishiMitra Advisory'): Promise<Conversation> {
    const id = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const conv: Conversation = {
      id,
      farmerId,
      title,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conv);
    return { ...conv };
  }

  async addMessage(
    conversationId: string,
    msg: Omit<ConversationMessage, 'id' | 'conversationId' | 'timestamp'>
  ): Promise<ConversationMessage> {
    let conv = this.conversations.get(conversationId);
    if (!conv) {
      conv = await this.create(msg.farmerId || 'farmer-ramesh-kumar');
      conversationId = conv.id;
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const fullMsg: ConversationMessage = {
      ...msg,
      id: messageId,
      conversationId,
      timestamp: now,
    };

    conv.messages.push(fullMsg);
    conv.updatedAt = now;
    return fullMsg;
  }

  async getRecentMessages(conversationId: string, limit = 10): Promise<ConversationMessage[]> {
    const conv = this.conversations.get(conversationId);
    if (!conv) return [];
    return conv.messages.slice(-limit);
  }

  async delete(id: string): Promise<boolean> {
    return this.conversations.delete(id);
  }
}
