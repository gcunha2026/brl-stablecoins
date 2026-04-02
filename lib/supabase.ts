import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client.
 * Uses SERVICE_KEY for write operations (cron, backfill).
 * Falls back to ANON_KEY for read-only operations.
 * Never uses NEXT_PUBLIC_ keys — those are for the client boundary only.
 */
function initSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL ?? "";
  const key =
    process.env.SUPABASE_SERVICE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    "";

  if (!url || !key) return null;
  return createClient(url, key);
}

export const supabase = initSupabase();
