-- =============================================================
-- Add per-chain activity tracking to daily_activity
-- Run this in Supabase SQL Editor BEFORE deploying the new code.
-- Safe to run multiple times.
-- =============================================================

-- 1. Add chain column (existing rows become 'ALL' = aggregated)
ALTER TABLE daily_activity ADD COLUMN IF NOT EXISTS chain TEXT NOT NULL DEFAULT 'ALL';

-- 2. Drop old unique constraint (ignore error if already dropped)
ALTER TABLE daily_activity DROP CONSTRAINT IF EXISTS daily_activity_symbol_date_key;

-- 3. Create new unique constraint
ALTER TABLE daily_activity ADD CONSTRAINT daily_activity_symbol_chain_date_key UNIQUE(symbol, chain, date);

-- 4. Update index for per-chain queries
DROP INDEX IF EXISTS idx_daily_activity_symbol_date;
CREATE INDEX IF NOT EXISTS idx_daily_activity_symbol_chain_date
  ON daily_activity(symbol, chain, date DESC);
