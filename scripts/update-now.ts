/**
 * Local runner — mirrors app/api/cron/update-activity/route.ts logic.
 * Usage: npx tsx --env-file=.env.local scripts/update-now.ts
 */

import { createClient } from "@supabase/supabase-js";
import {
  BLOCKSCOUT_V1,
  BLOCKSCOUT_V2,
  getBlockscoutContracts,
  getBlockscoutSymbols,
} from "../lib/contracts";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ZERO = "0x0000000000000000000000000000000000000000";

async function main() {
  for (const symbol of getBlockscoutSymbols()) {
    const contracts = getBlockscoutContracts(symbol);
    console.log(`\n=== ${symbol} ===`);
    const { data: existingWallets } = await supabase
      .from("known_wallets").select("wallet").eq("symbol", symbol);
    const knownWallets = new Set((existingWallets ?? []).map((w: any) => w.wallet));

    for (const { chain, address } of contracts) {
      const apiBase = BLOCKSCOUT_V1[chain];
      if (!apiBase) continue;

      try {
        const url = `${apiBase}?module=account&action=tokentx&contractaddress=${address}&page=1&offset=10000&sort=desc`;
        const res = await fetch(url);
        let json: any;
        try { json = await res.json(); } catch { console.log(`  ${chain}: parse error`); continue; }
        const items = json.result;
        if (!Array.isArray(items) || items.length === 0) {
          console.log(`  ${chain}: no items`);
          continue;
        }

        const dailyMap: Record<string, {
          mint_count: number; mint_volume: number;
          burn_count: number; burn_volume: number;
          trade_count: number; trade_volume: number;
          wallets: Set<string>;
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
              trade_count: 0, trade_volume: 0,
              wallets: new Set(),
            };
          }
          const d = dailyMap[date];

          if (from === ZERO) {
            d.mint_count++; d.mint_volume += value; d.wallets.add(to);
          } else if (to === ZERO) {
            d.burn_count++; d.burn_volume += value; d.wallets.add(from);
          } else {
            d.trade_count++; d.trade_volume += value;
            d.wallets.add(from); d.wallets.add(to);
          }
        }

        const addr = address.toLowerCase();
        const rows = Object.entries(dailyMap).map(([date, d]) => {
          let newCount = 0;
          d.wallets.forEach((w) => {
            if (!knownWallets.has(w)) { newCount++; knownWallets.add(w); }
          });
          return {
            symbol, chain, address: addr, date,
            mint_count: d.mint_count, mint_volume: d.mint_volume,
            burn_count: d.burn_count, burn_volume: d.burn_volume,
            trade_count: d.trade_count, trade_volume: d.trade_volume,
            active_wallets: d.wallets.size,
            new_wallets: newCount,
          };
        });

        const { error: upErr } = await supabase
          .from("daily_activity")
          .upsert(rows, { onConflict: "symbol,chain,address,date" });
        if (upErr) console.log(`  ${chain}: upsert error`, upErr.message);

        const walletRows: { symbol: string; wallet: string; first_seen: string }[] = [];
        for (const [date, d] of Object.entries(dailyMap)) {
          d.wallets.forEach((w) => {
            walletRows.push({ symbol, wallet: w, first_seen: date });
          });
        }
        for (let i = 0; i < walletRows.length; i += 500) {
          await supabase.from("known_wallets").upsert(
            walletRows.slice(i, i + 500),
            { onConflict: "symbol,wallet", ignoreDuplicates: true }
          );
        }

        const dates = Object.keys(dailyMap).sort();
        const label = `${chain}@${addr.slice(0, 10)}`;
        console.log(`  ${label}: ${items.length} transfers, ${dates.length} days (${dates[0]} → ${dates[dates.length - 1]})`);
      } catch (e: any) {
        console.log(`  ${chain}@${address.slice(0, 10)}: error`, e.message);
      }
    }

    try {
      let totalHolders = 0, totalTransfers = 0;
      for (const { chain, address } of contracts) {
        const v2 = BLOCKSCOUT_V2[chain];
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
      console.log(`  counters: ${totalHolders} holders, ${totalTransfers} transfers`);
    } catch (e: any) {
      console.log(`  counters error:`, e.message);
    }
  }
  console.log("\ndone");
}

main().catch((e) => { console.error(e); process.exit(1); });
