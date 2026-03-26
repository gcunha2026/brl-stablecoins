import { NextResponse } from "next/server";
import { fetchAllStablecoins } from "@/lib/blockchain";
import { supabase } from "@/lib/supabase";

export const revalidate = 300;

export async function GET() {
  const coins = await fetchAllStablecoins();
  const totalSupply = coins.reduce((s, c) => s + c.totalSupply, 0);
  const totalMarketCapUsd = coins.reduce((s, c) => s + c.marketCapUsd, 0);
  const totalVolume = coins.reduce((s, c) => s + c.volume24hUsd, 0);

  // Get holders from Supabase
  let totalHolders = 0;
  if (supabase) {
    const { data } = await supabase.from("token_counters").select("holders");
    totalHolders = (data ?? []).reduce((s: number, r: any) => s + (r.holders ?? 0), 0);
  }

  return NextResponse.json({
    total_stablecoins: coins.length,
    total_supply: totalSupply,
    total_market_cap_usd: totalMarketCapUsd,
    total_volume_24h_usd: totalVolume,
    total_holders: totalHolders,
    last_update: new Date().toISOString(),
  });
}
