/**
 * PostgreSQL Database Adapter Implementation
 */

import type {
  IDatabaseAdapter,
  IUserRepository,
  IFarmerRepository,
  IConversationRepository,
  ISchemeRepository,
  IMandiRepository,
} from './dbInterface.ts';
import { PostgresClient, pgClient } from './postgresClient.ts';
import {
  PostgresUserRepository,
  PostgresFarmerRepository,
  PostgresConversationRepository,
  PostgresSchemeRepository,
  PostgresMandiRepository,
} from '../repositories/index.ts';

export class PostgresDatabaseAdapter implements IDatabaseAdapter {
  public user: IUserRepository;
  public farmer: IFarmerRepository;
  public conversation: IConversationRepository;
  public scheme: ISchemeRepository;
  public mandi: IMandiRepository;
  private client: PostgresClient;

  constructor(client: PostgresClient = pgClient) {
    this.client = client;
    this.user = new PostgresUserRepository(client);
    this.farmer = new PostgresFarmerRepository(client);
    this.conversation = new PostgresConversationRepository(client);
    this.scheme = new PostgresSchemeRepository(client);
    this.mandi = new PostgresMandiRepository(client);
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }
}
