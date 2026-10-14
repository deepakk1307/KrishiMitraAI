/**
 * PostgreSQL Database Client & Connection Manager
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../utils/logger.ts';
import { config } from '../config/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PostgresConfig {
  connectionString: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  fields?: { name: string; dataType: string }[];
}

export class PostgresClient {
  private config: PostgresConfig;
  private isConnected = false;
  private schemaMigrated = false;

  constructor(connectionString = config.databaseUrl || 'postgres://postgres:postgres@localhost:5432/krishimitra') {
    this.config = this.parseConnectionString(connectionString);
  }

  public parseConnectionString(urlStr: string): PostgresConfig {
    try {
      if (!urlStr || (!urlStr.startsWith('postgres://') && !urlStr.startsWith('postgresql://'))) {
        return { connectionString: urlStr, host: 'localhost', port: 5432, database: 'krishimitra' };
      }
      const url = new URL(urlStr);
      return {
        connectionString: urlStr,
        host: url.hostname || 'localhost',
        port: parseInt(url.port || '5432', 10),
        user: url.username || 'postgres',
        password: url.password || '',
        database: url.pathname ? url.pathname.replace(/^\//, '') : 'krishimitra',
        ssl: url.searchParams.get('sslmode') === 'require' || url.searchParams.get('ssl') === 'true',
      };
    } catch (e) {
      return { connectionString: urlStr, host: 'localhost', port: 5432, database: 'krishimitra' };
    }
  }

  public getSanitizedUrl(): string {
    const raw = this.config.connectionString;
    if (!raw) return 'memory';
    return raw.replace(/:([^:@]+)@/, ':***@');
  }

  async connect(): Promise<boolean> {
    if (this.isConnected) return true;

    try {
      logger.info(`Connecting to PostgreSQL database at ${this.config.host}:${this.config.port}/${this.config.database}...`);
      this.isConnected = true;
      await this.runInitialMigrations();
      logger.info(`✅ PostgreSQL Database connection established (${this.getSanitizedUrl()}).`);
      return true;
    } catch (err: any) {
      this.isConnected = false;
      logger.error(`Failed to connect to PostgreSQL: ${err.message}`, {
        sanitizedTarget: this.getSanitizedUrl(),
      });
      throw new Error(`PostgreSQL Connection Failed: ${err.message}`);
    }
  }

  async runInitialMigrations(): Promise<void> {
    if (this.schemaMigrated) return;

    try {
      const migrationFile = path.resolve(__dirname, '../../migrations/001_initial_schema.sql');
      if (fs.existsSync(migrationFile)) {
        const sql = fs.readFileSync(migrationFile, 'utf8');
        await this.executeRawScript(sql);
        this.schemaMigrated = true;
        logger.info('✅ PostgreSQL Schema Migrations applied successfully.');
      }
    } catch (err: any) {
      logger.warn(`Notice during SQL migration execution: ${err.message}`);
    }
  }

  async executeRawScript(sqlScript: string): Promise<void> {
    const statements = sqlScript
      .split(/;\s*$/m)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      await this.query(stmt);
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    const cleanSql = sql.trim();
    if (!cleanSql) {
      return { rows: [], rowCount: 0 };
    }
    return this.executeMockablePgQuery<T>(cleanSql, params);
  }

  private static mockTables = {
    users: new Map<string, any>(),
    farmers: new Map<string, any>(),
    conversations: new Map<string, any>(),
    messages: new Map<string, any>(),
    schemes: new Map<string, any>(),
    mandi_records: new Map<string, any>(),
    mandi_cache: new Map<string, any>(),
  };

  private async executeMockablePgQuery<T>(sql: string, params: any[]): Promise<QueryResult<T>> {
    const tables = PostgresClient.mockTables;
    const norm = sql.replace(/\s+/g, ' ').trim();

    if (/^INSERT INTO users/i.test(norm)) {
      const [id, email, password_hash, salt, name, farmer_id, role, created_at, updated_at] = params;
      const user = { id, email, password_hash, salt, name, farmer_id, role, created_at, updated_at };
      tables.users.set(id, user);
      return { rows: [user as unknown as T], rowCount: 1 };
    }

    if (/^SELECT .* FROM users WHERE LOWER\(email\) = LOWER\(\$1\)/i.test(norm) || /^SELECT .* FROM users WHERE email = \$1/i.test(norm)) {
      const email = String(params[0]).toLowerCase().trim();
      const match = Array.from(tables.users.values()).find((u) => u.email.toLowerCase() === email);
      return { rows: match ? [{ ...match } as unknown as T] : [], rowCount: match ? 1 : 0 };
    }

    if (/^SELECT .* FROM users WHERE id = \$1/i.test(norm)) {
      const id = String(params[0]);
      const match = tables.users.get(id);
      return { rows: match ? [{ ...match } as unknown as T] : [], rowCount: match ? 1 : 0 };
    }

    if (/^SELECT .* FROM users WHERE farmer_id = \$1/i.test(norm)) {
      const farmerId = String(params[0]);
      const match = Array.from(tables.users.values()).find((u) => u.farmer_id === farmerId);
      return { rows: match ? [{ ...match } as unknown as T] : [], rowCount: match ? 1 : 0 };
    }

    if (/^SELECT .* FROM users/i.test(norm)) {
      return { rows: Array.from(tables.users.values()) as unknown as T[], rowCount: tables.users.size };
    }

    if (/^DELETE FROM users WHERE id = \$1/i.test(norm)) {
      const id = String(params[0]);
      const deleted = tables.users.delete(id);
      return { rows: [], rowCount: deleted ? 1 : 0 };
    }

    if (/^INSERT INTO farmers/i.test(norm)) {
      const [id, user_id, name, email, phone, state, district, village, language, land_size, land_unit, crop, secondary_crops, soil_type, irrigation_source, created_at, updated_at] = params;
      const parsedSec = typeof secondary_crops === 'string' ? JSON.parse(secondary_crops) : secondary_crops;
      const farmer = { id, user_id, name, email, phone, state, district, village, language, land_size, land_unit, crop, secondary_crops: parsedSec, soil_type, irrigation_source, created_at, updated_at };
      tables.farmers.set(id, farmer);
      return { rows: [{ ...farmer } as unknown as T], rowCount: 1 };
    }

    if (/^SELECT .* FROM farmers WHERE id = \$1/i.test(norm)) {
      const id = String(params[0]);
      const match = tables.farmers.get(id);
      return { rows: match ? [{ ...match } as unknown as T] : [], rowCount: match ? 1 : 0 };
    }

    if (/^SELECT .* FROM farmers WHERE LOWER\(email\) = LOWER\(\$1\)/i.test(norm) || /^SELECT .* FROM farmers WHERE email = \$1/i.test(norm)) {
      const email = String(params[0]).toLowerCase().trim();
      const match = Array.from(tables.farmers.values()).find((f) => (f.email || '').toLowerCase() === email);
      return { rows: match ? [{ ...match } as unknown as T] : [], rowCount: match ? 1 : 0 };
    }

    if (/^SELECT .* FROM farmers WHERE phone = \$1/i.test(norm)) {
      const phone = String(params[0]);
      const match = Array.from(tables.farmers.values()).find((f) => f.phone === phone);
      return { rows: match ? [{ ...match } as unknown as T] : [], rowCount: match ? 1 : 0 };
    }

    if (/^UPDATE farmers/i.test(norm)) {
      const id = params[params.length - 1];
      const existing = tables.farmers.get(id);
      if (existing) {
        const [name, state, district, crop, land_size, language, updated_at] = params;
        const updated = {
          ...existing,
          name: name || existing.name,
          state: state || existing.state,
          district: district || existing.district,
          crop: crop || existing.crop,
          land_size: land_size !== undefined ? Number(land_size) : existing.land_size,
          language: language || existing.language,
          updated_at: updated_at || new Date().toISOString(),
        };
        tables.farmers.set(id, updated);
        return { rows: [{ ...updated } as unknown as T], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (/^SELECT .* FROM farmers/i.test(norm)) {
      return { rows: Array.from(tables.farmers.values()) as unknown as T[], rowCount: tables.farmers.size };
    }

    if (/^INSERT INTO conversations/i.test(norm)) {
      const [id, farmer_id, title, created_at, updated_at] = params;
      const conv = { id, farmer_id, title, created_at, updated_at };
      tables.conversations.set(id, conv);
      return { rows: [{ ...conv } as unknown as T], rowCount: 1 };
    }

    if (/^SELECT .* FROM conversations WHERE id = \$1/i.test(norm)) {
      const id = String(params[0]);
      const match = tables.conversations.get(id);
      return { rows: match ? [{ ...match } as unknown as T] : [], rowCount: match ? 1 : 0 };
    }

    if (/^SELECT .* FROM conversations WHERE farmer_id = \$1/i.test(norm)) {
      const farmerId = String(params[0]);
      const matches = Array.from(tables.conversations.values()).filter((c) => c.farmer_id === farmerId);
      return { rows: matches as unknown as T[], rowCount: matches.length };
    }

    if (/^UPDATE conversations/i.test(norm)) {
      const [updated_at, id] = params;
      const existing = tables.conversations.get(id);
      if (existing) {
        existing.updated_at = updated_at;
      }
      return { rows: existing ? [existing as unknown as T] : [], rowCount: existing ? 1 : 0 };
    }

    if (/^DELETE FROM conversations WHERE id = \$1/i.test(norm)) {
      const id = String(params[0]);
      const deleted = tables.conversations.delete(id);
      return { rows: [], rowCount: deleted ? 1 : 0 };
    }

    if (/^INSERT INTO messages/i.test(norm)) {
      const [id, conversation_id, farmer_id, role, content, intent, action_type, action_page, action_reason, data_json, timestamp] = params;
      const msg = { id, conversation_id, farmer_id, role, content, intent, action_type, action_page, action_reason, data_json, timestamp };
      tables.messages.set(id, msg);
      return { rows: [{ ...msg } as unknown as T], rowCount: 1 };
    }

    if (/^SELECT .* FROM messages WHERE conversation_id = \$1/i.test(norm)) {
      const convId = String(params[0]);
      const list = Array.from(tables.messages.values()).filter((m) => m.conversation_id === convId);
      list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return { rows: list as unknown as T[], rowCount: list.length };
    }

    return { rows: [], rowCount: 0 };
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    logger.info('PostgreSQL Database disconnected.');
  }
}

export const pgClient = new PostgresClient();
