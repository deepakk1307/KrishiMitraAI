-- ============================================================================
-- KrishiMitra AI - PostgreSQL Database Initial Schema Migration
-- Migration: 001_initial_schema.sql
-- ============================================================================

-- 1. Users Table (Authentication & Account Credentials)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    farmer_id VARCHAR(64) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'farmer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Farmers Table (Agricultural Profile & Farm Parameters)
CREATE TABLE IF NOT EXISTS farmers (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(32),
    state VARCHAR(128) NOT NULL,
    district VARCHAR(128) NOT NULL,
    village VARCHAR(128),
    language VARCHAR(32) NOT NULL DEFAULT 'Hindi',
    land_size NUMERIC(8, 2) NOT NULL DEFAULT 1.0,
    land_unit VARCHAR(16) NOT NULL DEFAULT 'acres',
    crop VARCHAR(128) NOT NULL,
    secondary_crops JSONB DEFAULT '[]'::jsonb,
    soil_type VARCHAR(128),
    irrigation_source VARCHAR(64) DEFAULT 'tubewell',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Conversations Table (AI Multi-Turn Session Metadata)
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(64) PRIMARY KEY,
    farmer_id VARCHAR(64) NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'KrishiMitra Advisory',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Messages Table (Dialogue Turns, Intents, & Tool Executions)
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    farmer_id VARCHAR(64),
    role VARCHAR(32) NOT NULL CHECK (role IN ('farmer', 'assistant', 'system')),
    content TEXT NOT NULL,
    intent VARCHAR(64),
    action_type VARCHAR(32),
    action_page VARCHAR(128),
    action_reason TEXT,
    data_json JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Schemes Table (Verified Government Schemes Repository)
CREATE TABLE IF NOT EXISTS schemes (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    hindi_name VARCHAR(255),
    category VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    state VARCHAR(128) NOT NULL DEFAULT 'All India',
    eligible_crops JSONB NOT NULL DEFAULT '["All crops"]'::jsonb,
    min_acres NUMERIC(8, 2),
    max_acres NUMERIC(8, 2),
    benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
    eligibility JSONB NOT NULL DEFAULT '[]'::jsonb,
    documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    official_source VARCHAR(512) NOT NULL,
    application_process TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Mandi Records Table (APMC Market Price Snapshots)
CREATE TABLE IF NOT EXISTS mandi_records (
    id VARCHAR(128) PRIMARY KEY,
    commodity VARCHAR(128) NOT NULL,
    crop VARCHAR(128) NOT NULL,
    variety VARCHAR(128),
    state VARCHAR(128) NOT NULL,
    district VARCHAR(128) NOT NULL,
    market VARCHAR(255) NOT NULL,
    primary_mandi VARCHAR(255) NOT NULL,
    min_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    max_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    modal_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    current_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    arrival_date VARCHAR(64),
    msp_declared NUMERIC(10, 2) NOT NULL DEFAULT 0,
    nearby_mandis_json JSONB DEFAULT '[]'::jsonb,
    source VARCHAR(255) NOT NULL DEFAULT 'data.gov.in / Agmarknet Daily Mandi Price API',
    data_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_available BOOLEAN NOT NULL DEFAULT true,
    unavailable_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Mandi TTL Cache Table (Rate-Limit Protection & Freshness)
CREATE TABLE IF NOT EXISTS mandi_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    data_json JSONB NOT NULL,
    data_timestamp TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes for High-Performance Queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_farmer_id ON users(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmers_state_district ON farmers(state, district);
CREATE INDEX IF NOT EXISTS idx_farmers_crop ON farmers(crop);
CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_farmer_id ON conversations(farmer_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_schemes_state ON schemes(state);
CREATE INDEX IF NOT EXISTS idx_schemes_category ON schemes(category);
CREATE INDEX IF NOT EXISTS idx_mandi_records_lookup ON mandi_records(crop, state, district);
CREATE INDEX IF NOT EXISTS idx_mandi_cache_expires ON mandi_cache(expires_at);
