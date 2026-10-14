/**
 * Database Connection Factory & Adapter Selector
 */

import type { IDatabaseAdapter } from './dbInterface.ts';
import { InMemoryDatabaseAdapter } from './inMemoryDb.ts';
import { PostgresDatabaseAdapter } from './postgresDb.ts';
import { PostgresClient } from './postgresClient.ts';
import { logger } from '../utils/logger.ts';
import { config } from '../config/index.ts';

export function createDatabaseAdapter(databaseUrl = config.databaseUrl): IDatabaseAdapter {
  const isPostgres =
    databaseUrl &&
    (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'));

  if (isPostgres) {
    try {
      const client = new PostgresClient(databaseUrl);
      return new PostgresDatabaseAdapter(client);
    } catch (err: any) {
      logger.warn(`Failed to initialize Postgres adapter (${err.message}). Falling back to in-memory adapter.`);
      return new InMemoryDatabaseAdapter();
    }
  }

  return new InMemoryDatabaseAdapter();
}

export const db: IDatabaseAdapter = createDatabaseAdapter();

export async function initDatabase(): Promise<void> {
  try {
    await db.connect();
  } catch (err: any) {
    logger.error(`Database connection warning: ${err.message}`);
  }
}
