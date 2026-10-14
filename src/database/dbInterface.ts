/**
 * Database Interface Contracts for KrishiMitra AI
 * Defines abstract repository interfaces for User, Farmer, Conversation, Schemes, and Mandi.
 */

import type { FarmerProfile, UserAccount } from '../models/farmer.ts';
import type { Conversation, ConversationMessage } from '../models/assistant.ts';
import type { GovernmentScheme, SchemeEligibilityFilter } from '../models/schemes.ts';
import type { MandiPriceRecord, MandiQuery } from '../models/mandi.ts';

export interface IUserRepository {
  findByEmail(email: string): Promise<UserAccount | null>;
  findById(id: string): Promise<UserAccount | null>;
  findByFarmerId(farmerId: string): Promise<UserAccount | null>;
  create(user: Omit<UserAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserAccount>;
  update(id: string, updates: Partial<UserAccount>): Promise<UserAccount | null>;
  delete(id: string): Promise<boolean>;
  listAll(): Promise<UserAccount[]>;
}

export interface IFarmerRepository {
  getById(id: string): Promise<FarmerProfile | null>;
  getByPhone(phone: string): Promise<FarmerProfile | null>;
  getByEmail(email: string): Promise<FarmerProfile | null>;
  getDefaultProfile(): Promise<FarmerProfile>;
  create(profile: Omit<FarmerProfile, 'id' | 'created_at' | 'updated_at'>): Promise<FarmerProfile>;
  update(id: string, updates: Partial<FarmerProfile>): Promise<FarmerProfile | null>;
  listAll(): Promise<FarmerProfile[]>;
}

export interface IConversationRepository {
  getById(id: string): Promise<Conversation | null>;
  listByFarmer(farmerId: string, limit?: number): Promise<Conversation[]>;
  create(farmerId: string, title?: string): Promise<Conversation>;
  addMessage(conversationId: string, message: Omit<ConversationMessage, 'id' | 'conversationId' | 'timestamp'>): Promise<ConversationMessage>;
  getRecentMessages(conversationId: string, limit?: number): Promise<ConversationMessage[]>;
  delete(id: string): Promise<boolean>;
}

export interface ISchemeRepository {
  getAll(): Promise<GovernmentScheme[]>;
  getById(id: string): Promise<GovernmentScheme | null>;
  filter(filter: SchemeEligibilityFilter): Promise<GovernmentScheme[]>;
  search(query: string): Promise<GovernmentScheme[]>;
  addScheme(scheme: GovernmentScheme): Promise<GovernmentScheme>;
}

export interface IMandiRepository {
  getPrices(query: MandiQuery): Promise<MandiPriceRecord | null>;
  getAllCrops(): Promise<string[]>;
  getAllStates(): Promise<string[]>;
  getDistrictsForState(state: string): Promise<string[]>;
  seedRecords?(records: MandiPriceRecord[]): Promise<void>;
}

export interface IDatabaseAdapter {
  user: IUserRepository;
  farmer: IFarmerRepository;
  conversation: IConversationRepository;
  scheme: ISchemeRepository;
  mandi: IMandiRepository;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
