/**
 * PostgreSQL Database Persistence & Schema Test Suite
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PostgresClient } from '../src/database/postgresClient.ts';
import { PostgresDatabaseAdapter } from '../src/database/postgresDb.ts';
import { InMemoryDatabaseAdapter } from '../src/database/inMemoryDb.ts';
import { createDatabaseAdapter } from '../src/database/dbConnection.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('PostgreSQL Database Persistence & Schema Test Suite', () => {
  let pgAdapter: PostgresDatabaseAdapter;
  let inMemoryAdapter: InMemoryDatabaseAdapter;

  before(async () => {
    pgAdapter = new PostgresDatabaseAdapter(new PostgresClient('postgres://postgres:postgres@localhost:5432/krishimitra'));
    inMemoryAdapter = new InMemoryDatabaseAdapter();
    await pgAdapter.connect();
    await inMemoryAdapter.connect();
  });

  after(async () => {
    await pgAdapter.disconnect();
    await inMemoryAdapter.disconnect();
  });

  it('1. Migration DDL: should contain all required tables and constraints', () => {
    const migrationFile = path.resolve(__dirname, '../migrations/001_initial_schema.sql');
    assert.ok(fs.existsSync(migrationFile), '001_initial_schema.sql must exist in migrations directory');

    const ddl = fs.readFileSync(migrationFile, 'utf8');
    const requiredTables = [
      'CREATE TABLE IF NOT EXISTS users',
      'CREATE TABLE IF NOT EXISTS farmers',
      'CREATE TABLE IF NOT EXISTS conversations',
      'CREATE TABLE IF NOT EXISTS messages',
      'CREATE TABLE IF NOT EXISTS schemes',
      'CREATE TABLE IF NOT EXISTS mandi_records',
      'CREATE TABLE IF NOT EXISTS mandi_cache',
    ];

    for (const tbl of requiredTables) {
      assert.ok(ddl.includes(tbl), `Migration DDL must include table definition: ${tbl}`);
    }

    assert.ok(ddl.includes('REFERENCES farmers(id) ON DELETE CASCADE'), 'Conversations must cascade delete with farmer');
    assert.ok(ddl.includes('REFERENCES conversations(id) ON DELETE CASCADE'), 'Messages must cascade delete with conversation');
  });

  it('2. Performance Indexes: should define indexes for high-throughput lookup fields', () => {
    const migrationFile = path.resolve(__dirname, '../migrations/001_initial_schema.sql');
    const ddl = fs.readFileSync(migrationFile, 'utf8');

    const expectedIndexes = [
      'idx_users_email',
      'idx_users_farmer_id',
      'idx_farmers_state_district',
      'idx_farmers_crop',
      'idx_conversations_farmer_id',
      'idx_messages_conversation_id',
      'idx_schemes_state',
      'idx_schemes_category',
      'idx_mandi_records_lookup',
      'idx_mandi_cache_expires',
    ];

    for (const idx of expectedIndexes) {
      assert.ok(ddl.includes(idx), `Migration DDL must define index: ${idx}`);
    }
  });

  it('3. Connection String Parsing & Credential Redaction', () => {
    const client = new PostgresClient('postgres://agro_admin:secret_pass_123@prod-db.krishimitra.internal:5432/krishi_prod');
    const config = client.parseConnectionString('postgres://agro_admin:secret_pass_123@prod-db.krishimitra.internal:5432/krishi_prod');

    assert.equal(config.host, 'prod-db.krishimitra.internal');
    assert.equal(config.port, 5432);
    assert.equal(config.user, 'agro_admin');
    assert.equal(config.password, 'secret_pass_123');
    assert.equal(config.database, 'krishi_prod');

    const sanitized = client.getSanitizedUrl();
    assert.ok(!sanitized.includes('secret_pass_123'), 'Sanitized URL must NEVER contain cleartext passwords');
    assert.ok(sanitized.includes(':***@'), 'Password must be masked in sanitized logs');
  });

  it('4. Adapter Interface Parity: Postgres and InMemory adapters both satisfy IDatabaseAdapter', () => {
    const checkAdapter = (adapter: any, name: string) => {
      assert.ok(adapter.user, `${name} must expose user repository`);
      assert.ok(adapter.farmer, `${name} must expose farmer repository`);
      assert.ok(adapter.conversation, `${name} must expose conversation repository`);
      assert.ok(adapter.scheme, `${name} must expose scheme repository`);
      assert.ok(adapter.mandi, `${name} must expose mandi repository`);
      assert.equal(typeof adapter.connect, 'function');
      assert.equal(typeof adapter.disconnect, 'function');
    };

    checkAdapter(pgAdapter, 'PostgresDatabaseAdapter');
    checkAdapter(inMemoryAdapter, 'InMemoryDatabaseAdapter');
  });

  it('5. PostgreSQL User Repository: CRUD, lookups, and scrypt hash storage', async () => {
    const email = `test.pg.user.${Date.now()}@krishimitra.ai`;
    const createdUser = await pgAdapter.user.create({
      email,
      passwordHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      salt: '16bytesalt123456',
      name: 'Harpreet Kaur',
      farmerId: 'farmer-harpreet-kaur',
      role: 'farmer',
    });

    assert.ok(createdUser.id, 'Created user must have a persistent ID');
    assert.equal(createdUser.email, email.toLowerCase());

    const foundByEmail = await pgAdapter.user.findByEmail(email);
    assert.ok(foundByEmail, 'Should locate user by email in PostgreSQL');
    assert.equal(foundByEmail?.name, 'Harpreet Kaur');
    assert.equal(foundByEmail?.passwordHash, createdUser.passwordHash);

    const foundById = await pgAdapter.user.findById(createdUser.id);
    assert.equal(foundById?.farmerId, 'farmer-harpreet-kaur');
  });

  it('6. PostgreSQL Farmer Repository: Profile creation, crop/location parameters', async () => {
    const created = await pgAdapter.farmer.create({
      name: 'Gurdeep Singh',
      email: `gurdeep.${Date.now()}@krishimitra.ai`,
      state: 'Punjab',
      district: 'Patiala',
      language: 'Punjabi',
      land_size: 7.5,
      land_unit: 'acres',
      crop: 'Paddy',
      secondary_crops: ['Wheat', 'Mustard'],
      irrigation_source: 'tubewell',
    });

    assert.ok(created.id, 'Farmer profile should be generated with unique ID');
    assert.equal(created.state, 'Punjab');
    assert.equal(created.district, 'Patiala');
    assert.equal(created.crop, 'Paddy');
    assert.equal(created.land_size, 7.5);

    const retrieved = await pgAdapter.farmer.getById(created.id);
    assert.ok(retrieved, 'Profile must persist and be retrievable by ID');
    assert.equal(retrieved?.language, 'Punjabi');
    assert.deepEqual(retrieved?.secondary_crops, ['Wheat', 'Mustard']);
  });

  it('7. PostgreSQL Conversation & Multi-Turn Message Persistence', async () => {
    const farmer = await pgAdapter.farmer.getDefaultProfile();
    const conv = await pgAdapter.conversation.create(farmer.id, 'Wheat Advisory Discussion');
    assert.ok(conv.id, 'Conversation session must be created with unique ID');

    const msg1 = await pgAdapter.conversation.addMessage(conv.id, {
      farmerId: farmer.id,
      role: 'farmer',
      content: 'Is rain expected tomorrow in Lucknow?',
    });
    assert.ok(msg1.id, 'Farmer message should persist');

    const msg2 = await pgAdapter.conversation.addMessage(conv.id, {
      farmerId: farmer.id,
      role: 'assistant',
      content: 'Yes, 75% probability of moderate showers. Hold irrigation.',
      intent: 'weather',
      action: { type: 'navigate', page: '/weather-advisory', reason: 'Check 5-day forecast' },
      data: { rain_prob: 75 },
    });
    assert.ok(msg2.id, 'Assistant response should persist');

    const fullConv = await pgAdapter.conversation.getById(conv.id);
    assert.ok(fullConv, 'Conversation must be retrievable with all turn records');
    assert.equal(fullConv?.messages.length, 2);
    assert.equal(fullConv?.messages[0].content, 'Is rain expected tomorrow in Lucknow?');
    assert.equal(fullConv?.messages[1].intent, 'weather');
    assert.equal(fullConv?.messages[1].action?.page, '/weather-advisory');
  });

  it('8. Connection Factory & Fallback Resilience', () => {
    const memoryDb = createDatabaseAdapter('memory');
    assert.ok(memoryDb instanceof InMemoryDatabaseAdapter, 'DATABASE_URL=memory should instantiate InMemoryDatabaseAdapter');

    const pgDb = createDatabaseAdapter('postgres://user:pass@localhost:5432/mydb');
    assert.ok(pgDb instanceof PostgresDatabaseAdapter, 'postgres:// URL should instantiate PostgresDatabaseAdapter');
  });
});
