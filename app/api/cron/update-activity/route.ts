/**
 * Daily cron job — fetches new transfers since last backfill and updates Supabase.
 * Triggered by Vercel Cron or manually via GET request.
 * Protected by CRON_SECRET env var.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const BLOCKSCOUT_V1: Record<string, string> = {
  Base: "https://base.blockscout.com/api",
  Polygon: "https://polygon.blockscout.com/api",
  Ethereum: "https://eth.blockscout.com/api",
  Celo: "https://celo.blockscout.com/api",
  Avalanche: "https://avalanche.blockscout.com/api",
  Gnosis: "https://gnosis.blockscout.com/api",
  Arbitrum: "https://arbitrum.blockscout.com/api",
};

const CONTRACTS: Record<string, { chain: string; address: string }[]> = {
  BRLV: [{ chain: "Base", address: "0x57323Db6d883811C17877d075e05AD9E2ED41519" }],
  BRZ: [
    { chain: "Polygon", address: "0x4eD141110F6EeeAbA9A1df36d8c26f684d2475Dc" },
    { chain: "Arbitrum", address: "0xA8940698FdA5A07AbAEf4A5ccDf2f1Bb525B47A2" },
  ],
  BRLA: [{ chain: "Polygon", address: "0xE6A537a407488807F0bbeb0038B79004f19DDDFb" }],
  ABRL: [{ chain: "Polygon", address: "0x5acad7EDCcD4846F99335E26a7e6398D869dEc4f" }],
  BRL1: [{ chain: "Polygon", address: "0x5C067C80C00eCd2345b05E83A3e758eF799C40B5" }],
  BRLC: [{ chain: "Celo", address: "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787" }],
};

const ZERO = "0x0000000000000000000000000000000000000000";

export async function GET(req: NextRequest) {
  // Verify cron secret (optional, for security)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Missing Supabase env" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const results: Record<string, string> = {};

  for (const [symbol, contracts] of Object.entries(CONTRACTS)) {
    for (const { chain, address } of contracts) {
      const apiBase = BLOCKSCOUT_V1[chain];
      if (!apiBase) continue;

      try {
        // Fetch latest 10k transfers (covers ~1-5 days for most tokens)
        const url = `${apiBase}?module=account&action=tokentx&contractaddress=${address}&page=1&offset=10000&sort=desc`;
        const res = await fetch(url);
        let json: any;
        try { json = await res.json(); } catch { continue; }
        const items = json.result;
        if (!Array.isArray(items) || items.length === 0) continue;

        // Aggregate by day
        const dailyMap: Record<string, {
          mint_count: number; mint_volume: number;
          burn_count: number; burn_volume: number;
          trade_count: number; wallets: Set<string>;
        }> = {};

        for (const tx of items) {
          const ts = parseInt(tx.timeStamp ?? "0", 10);
          const date = new Date(ts * 1000).toISOString().slice(0, 10);
          const from = (tx.from ?? "").toLowerCase();
          const to = (tx.to ?? "").toLowerCase();
          const decimals = parseInt(tx.tokenDecimal ?? "18", 10);
          const value = parseInt(tx.value ?? "0", 10) / 10 ** decimals;

          if (!dailyMap[date]) {
            dailyMap[date] = {
              mint_count: 0, mint_volume: 0,
              burn_count: 0, burn_volume: 0,
              trade_count: 0, wallets: new Set(),
            };
          }
          const d = dailyMap[date];

          if (from === ZERO) {
            d.mint_count++; d.mint_volume += value; d.wallets.add(to);
          } else if (to === ZERO) {
            d.burn_count++; d.burn_volume += value; d.wallets.add(from);
          } else {
            d.trade_count++; d.wallets.add(from); d.wallets.add(to);
          }
        }

        // Upsert into Supabase
        const rows = Object.entries(dailyMap).map(([date, d]) => ({
          symbol, date,
          mint_count: d.mint_count, mint_volume: d.mint_volume,
          burn_count: d.burn_count, burn_volume: d.burn_volume,
          trade_count: d.trade_count,
          active_wallets: d.wallets.size,
          new_wallets: 0,
        }));

        await supabase.from("daily_activity").upsert(rows, { onConflict: "symbol,date" });
        results[`${symbol}/${chain}`] = `${items.length} transfers, ${Object.keys(dailyMap).length} days`;
      } catch (err: any) {
        results[`${symbol}/${chain}`] = `error: ${err.message}`;
      }
    }

    // Update counters
    try {
      let totalHolders = 0, totalTransfers = 0;
      for (const { chain, address } of contracts) {
        const v2 = BLOCKSCOUT_V1[chain]?.replace("/api", "/api/v2");
        if (!v2) continue;
        const res = await fetch(`${v2}/tokens/${address}/counters`);
        if (!res.ok) continue;
        const data = await res.json();
        totalHolders += parseInt(data.token_holders_count ?? "0", 10);
        totalTransfers += parseInt(data.transfers_count ?? "0", 10);
      }
      await supabase.from("token_counters").upsert({
        symbol, holders: totalHolders, total_transfers: totalTransfers,
        updated_at: new Date().toISOString(),
      }, { onConflict: "symbol" });
    } catch {}
  }

  return NextResponse.json({ ok: true, updated: results, timestamp: new Date().toISOString() });
}
