-- BRL Stablecoins Dashboard - Supabase Schema
-- Run this in Supabase SQL Editor to create the tables

-- Daily aggregated activity per token
CREATE TABLE IF NOT EXISTS daily_activity (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  mint_count INTEGER DEFAULT 0,
  mint_volume NUMERIC DEFAULT 0,
  burn_count INTEGER DEFAULT 0,
  burn_volume NUMERIC DEFAULT 0,
  trade_count INTEGER DEFAULT 0,
  active_wallets INTEGER DEFAULT 0,
  new_wallets INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, date)
);

-- Index for fast queries by symbol + date range
CREATE INDEX IF NOT EXISTS idx_daily_activity_symbol_date
  ON daily_activity(symbol, date DESC);

-- Track backfill progress per token/chain
CREATE TABLE IF NOT EXISTS backfill_progress (
  id SERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  chain TEXT NOT NULL,
  last_page_params JSONB,       -- Blockscout pagination cursor
  last_date TEXT,                -- oldest date we've fetched
  total_transfers_fetched INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, running, done
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(symbol, chain)
);

-- Token counters (holders, total transfers) - updated daily
CREATE TABLE IF NOT EXISTS token_counters (
  symbol TEXT PRIMARY KEY,
  holders INTEGER DEFAULT 0,
  total_transfers INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Known wallets per token (for tracking new vs existing)
CREATE TABLE IF NOT EXISTS known_wallets (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  wallet TEXT NOT NULL,
  first_seen DATE NOT NULL,
  UNIQUE(symbol, wallet)
);

-- Index for fast wallet lookups
CREATE INDEX IF NOT EXISTS idx_known_wallets_symbol
  ON known_wallets(symbol);
