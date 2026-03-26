import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

async function main() {
  for (const table of ["daily_activity", "backfill_progress", "token_counters", "known_wallets"]) {
    const { error } = await supabase.from(table).update({ symbol: "BRLV" }).eq("symbol", "BRLY");
    console.log(`${table}: ${error ? error.message : "ok"}`);
  }

  const { data } = await supabase.from("token_counters").select("*");
  console.log("\nAll counters:");
  for (const row of data ?? []) {
    console.log(`  ${row.symbol}: holders=${row.holders}, transfers=${row.total_transfers}`);
  }
}

main().catch(console.error);
