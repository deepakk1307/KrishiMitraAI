/**
 * In-Memory & Default Database Adapter for KrishiMitra AI
 */

import type {
  IDatabaseAdapter,
  IUserRepository,
  IFarmerRepository,
  IConversationRepository,
  ISchemeRepository,
  IMandiRepository,
} from './dbInterface.ts';
import {
  InMemoryUserRepository,
  InMemoryFarmerRepository,
  InMemoryConversationRepository,
  InMemorySchemeRepository,
  InMemoryMandiRepository,
  SEED_FARMERS,
  SEED_USERS,
} from '../repositories/index.ts';

export class DatabaseAdapter implements IDatabaseAdapter {
  public user: IUserRepository;
  public farmer: IFarmerRepository;
  public conversation: IConversationRepository;
  public scheme: ISchemeRepository;
  public mandi: IMandiRepository;

  constructor() {
    this.user = new InMemoryUserRepository();
    this.farmer = new InMemoryFarmerRepository();
    this.conversation = new InMemoryConversationRepository();
    this.scheme = new InMemorySchemeRepository();
    this.mandi = new InMemoryMandiRepository();
  }

  async connect(): Promise<void> {}

  async disconnect(): Promise<void> {}
}

export class InMemoryDatabaseAdapter extends DatabaseAdapter {}

export const db = new DatabaseAdapter();
export { SEED_FARMERS, SEED_USERS };
