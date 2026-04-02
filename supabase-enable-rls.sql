-- =============================================================
-- Enable RLS on all existing tables
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE)
-- =============================================================

-- 1. Enable RLS on all tables
ALTER TABLE daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE backfill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE known_wallets ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Allow public read on daily_activity" ON daily_activity;
DROP POLICY IF EXISTS "Allow service_role write on daily_activity" ON daily_activity;
DROP POLICY IF EXISTS "Allow public read on backfill_progress" ON backfill_progress;
DROP POLICY IF EXISTS "Allow service_role write on backfill_progress" ON backfill_progress;
DROP POLICY IF EXISTS "Allow public read on token_counters" ON token_counters;
DROP POLICY IF EXISTS "Allow service_role write on token_counters" ON token_counters;
DROP POLICY IF EXISTS "Allow public read on known_wallets" ON known_wallets;
DROP POLICY IF EXISTS "Allow service_role write on known_wallets" ON known_wallets;

-- 3. Create SELECT policies (public read via anon key)
CREATE POLICY "Allow public read on daily_activity"
  ON daily_activity FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on backfill_progress"
  ON backfill_progress FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on token_counters"
  ON token_counters FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on known_wallets"
  ON known_wallets FOR SELECT
  USING (true);

-- 4. Create ALL policies for service_role (insert/update/delete)
CREATE POLICY "Allow service_role write on daily_activity"
  ON daily_activity FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role write on backfill_progress"
  ON backfill_progress FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role write on token_counters"
  ON token_counters FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role write on known_wallets"
  ON known_wallets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
