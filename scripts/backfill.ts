/**
 * Backfill script - fetches ALL historical transfers from Blockscout
 * and aggregates into Supabase. Run locally, can take hours for high-volume tokens.
 *
 * Usage: npx tsx scripts/backfill.ts [SYMBOL]
 * Example: npx tsx scripts/backfill.ts BRLA
 * Omit symbol to backfill all tokens.
 *
 * Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BLOCKSCOUT_URLS: Record<string, string> = {
  Base: "https://base.blockscout.com/api/v2",
  Polygon: "https://polygon.blockscout.com/api/v2",
  Ethereum: "https://eth.blockscout.com/api/v2",
  Celo: "https://celo.blockscout.com/api/v2",
  Moonbeam: "https://moonbeam.blockscout.com/api/v2",
  BSC: "https://bsc.blockscout.com/api/v2",
};

const CONTRACTS: Record<string, { chain: string; address: string }[]> = {
  BRLY: [{ chain: "Base", address: "0x57323Db6d883811C17877d075e05AD9E2ED41519" }],
  BRZ: [
    { chain: "Polygon", address: "0x4eD141110F6EeeAbA9A1df36d8c26f684d2475Dc" },
    { chain: "Ethereum", address: "0x420412E765BFa6d85aaaC94b4f7b708C89be2e2B" },
    { chain: "BSC", address: "0x71be881e9C5d4465B3FfF61e89c6f3651E69B5bb" },
  ],
  BRLA: [
    { chain: "Polygon", address: "0xE6A537a407488807F0bbeb0038B79004f19DDDFb" },
    { chain: "Moonbeam", address: "0xfeB25F3fDDad13F82C4d6dbc1481516F62236429" },
  ],
  ABRL: [{ chain: "Polygon", address: "0x5acad7EDCcD4846F99335E26a7e6398D869dEc4f" }],
  BRL1: [{ chain: "Polygon", address: "0x5C067C80C00eCd2345b05E83A3e758eF799C40B5" }],
  BRLC: [{ chain: "Celo", address: "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787" }],
};

const ZERO = "0x0000000000000000000000000000000000000000";

interface DailyAgg {
  mint_count: number;
  mint_volume: number;
  burn_count: number;
  burn_volume: number;
  trade_count: number;
  wallets: Set<string>;
}

function newDay(): DailyAgg {
  return { mint_count: 0, mint_volume: 0, burn_count: 0, burn_volume: 0, trade_count: 0, wallets: new Set() };
}

async function fetchPage(url: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const fullUrl = qs ? `${url}?${qs}` : url;
  const res = await fetch(fullUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getProgress(symbol: string, chain: string) {
  const { data } = await supabase
    .from("backfill_progress")
    .select("*")
    .eq("symbol", symbol)
    .eq("chain", chain)
    .single();
  return data;
}

async function saveProgress(
  symbol: string,
  chain: string,
  lastPageParams: any,
  lastDate: string,
  totalFetched: number,
  status: string
) {
  await supabase.from("backfill_progress").upsert(
    {
      symbol,
      chain,
      last_page_params: lastPageParams,
      last_date: lastDate,
      total_transfers_fetched: totalFetched,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "symbol,chain" }
  );
}

async function saveDailyBatch(
  symbol: string,
  dailyMap: Map<string, DailyAgg>,
  knownWallets: Set<string>
) {
  // Upsert daily_activity rows
  const rows = Array.from(dailyMap.entries()).map(([date, d]) => ({
    symbol,
    date,
    mint_count: d.mint_count,
    mint_volume: d.mint_volume,
    burn_count: d.burn_count,
    burn_volume: d.burn_volume,
    trade_count: d.trade_count,
    active_wallets: d.wallets.size,
    new_wallets: 0, // computed below
  }));

  if (rows.length > 0) {
    // For each day, count new wallets
    for (const row of rows) {
      const dayData = dailyMap.get(row.date)!;
      let newCount = 0;
      for (const w of dayData.wallets) {
        if (!knownWallets.has(w)) {
          newCount++;
          knownWallets.add(w);
        }
      }
      row.new_wallets = newCount;
    }

    const { error } = await supabase.from("daily_activity").upsert(rows, {
      onConflict: "symbol,date",
    });
    if (error) console.error("  Error saving daily:", error.message);
  }

  // Save new wallets in batches
  const newWalletRows: { symbol: string; wallet: string; first_seen: string }[] = [];
  for (const [date, d] of dailyMap.entries()) {
    for (const w of d.wallets) {
      newWalletRows.push({ symbol, wallet: w, first_seen: date });
    }
  }
  if (newWalletRows.length > 0) {
    // Insert ignore duplicates
    for (let i = 0; i < newWalletRows.length; i += 500) {
      const batch = newWalletRows.slice(i, i + 500);
      await supabase.from("known_wallets").upsert(batch, {
        onConflict: "symbol,wallet",
        ignoreDuplicates: true,
      });
    }
  }
}

async function backfillChain(symbol: string, chain: string, address: string) {
  const apiBase = BLOCKSCOUT_URLS[chain];
  if (!apiBase) {
    console.log(`  Skipping ${chain} - no Blockscout URL`);
    return;
  }

  // Check progress
  const progress = await getProgress(symbol, chain);
  if (progress?.status === "done") {
    console.log(`  ${chain}: already done (${progress.total_transfers_fetched} transfers)`);
    return;
  }

  let params: Record<string, string> = {};
  let totalFetched = progress?.total_transfers_fetched ?? 0;
  let lastDate = progress?.last_date ?? "";

  // Resume from last position
  if (progress?.last_page_params && progress.status === "running") {
    params = progress.last_page_params;
    console.log(`  ${chain}: resuming from page (${totalFetched} transfers so far, last date: ${lastDate})`);
  } else {
    console.log(`  ${chain}: starting fresh`);
    await saveProgress(symbol, chain, null, "", 0, "running");
  }

  // Load known wallets for this symbol
  const { data: existingWallets } = await supabase
    .from("known_wallets")
    .select("wallet")
    .eq("symbol", symbol);
  const knownWallets = new Set((existingWallets ?? []).map((w: any) => w.wallet));

  const url = `${apiBase}/tokens/${address}/transfers`;
  const MIN_DATE = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  let page = 0;
  let dailyMap = new Map<string, DailyAgg>();
  const SAVE_EVERY = 20; // save to DB every 20 pages

  while (true) {
    try {
      const data = await fetchPage(url, params);
      const items = data.items ?? [];
      if (items.length === 0) break;

      let reachedCutoff = false;

      for (const tx of items) {
        const from = (tx.from?.hash ?? "").toLowerCase();
        const to = (tx.to?.hash ?? "").toLowerCase();
        const total = tx.total ?? {};
        const decimals = parseInt(total.decimals ?? "18", 10);
        const value = parseInt(total.value ?? "0", 10) / 10 ** decimals;
        const date = (tx.timestamp ?? "").slice(0, 10);
        if (!date) continue;

        if (date < MIN_DATE) {
          reachedCutoff = true;
          break;
        }

        if (!dailyMap.has(date)) dailyMap.set(date, newDay());
        const d = dailyMap.get(date)!;

        if (from === ZERO) {
          d.mint_count++;
          d.mint_volume += value;
          d.wallets.add(to);
        } else if (to === ZERO) {
          d.burn_count++;
          d.burn_volume += value;
          d.wallets.add(from);
        } else {
          d.trade_count++;
          d.wallets.add(from);
          d.wallets.add(to);
        }

        lastDate = date;
        totalFetched++;
      }

      page++;

      // Save periodically
      if (page % SAVE_EVERY === 0) {
        await saveDailyBatch(symbol, dailyMap, knownWallets);
        dailyMap = new Map();
        const np = data.next_page_params;
        const nextParams = np
          ? Object.fromEntries(Object.entries(np).map(([k, v]) => [k, String(v)]))
          : null;
        await saveProgress(symbol, chain, nextParams, lastDate, totalFetched, "running");
        console.log(`    page ${page}: ${totalFetched} transfers, last date: ${lastDate}`);
      }

      if (reachedCutoff) break;

      const np = data.next_page_params;
      if (!np) break;
      params = {};
      for (const [k, v] of Object.entries(np)) params[k] = String(v);

      // Small delay to be respectful
      await new Promise((r) => setTimeout(r, 300));
    } catch (err: any) {
      console.error(`    Error on page ${page}: ${err.message}. Saving progress and retrying in 5s...`);
      await saveDailyBatch(symbol, dailyMap, knownWallets);
      dailyMap = new Map();
      await saveProgress(symbol, chain, params, lastDate, totalFetched, "running");
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  // Final save
  await saveDailyBatch(symbol, dailyMap, knownWallets);
  await saveProgress(symbol, chain, null, lastDate, totalFetched, "done");
  console.log(`  ${chain}: DONE - ${totalFetched} transfers, range up to ${lastDate}`);
}

async function updateCounters(symbol: string) {
  const contracts = CONTRACTS[symbol] ?? [];
  let totalHolders = 0;
  let totalTransfers = 0;

  for (const { chain, address } of contracts) {
    const apiBase = BLOCKSCOUT_URLS[chain];
    if (!apiBase) continue;
    try {
      const res = await fetch(`${apiBase}/tokens/${address}/counters`);
      if (!res.ok) continue;
      const data = await res.json();
      totalHolders += parseInt(data.token_holders_count ?? "0", 10);
      totalTransfers += parseInt(data.transfers_count ?? "0", 10);
    } catch {}
  }

  await supabase.from("token_counters").upsert(
    {
      symbol,
      holders: totalHolders,
      total_transfers: totalTransfers,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "symbol" }
  );
  console.log(`  Counters: ${totalHolders} holders, ${totalTransfers} transfers`);
}

async function main() {
  const targetSymbol = process.argv[2]?.toUpperCase();
  const symbols = targetSymbol ? [targetSymbol] : Object.keys(CONTRACTS);

  for (const symbol of symbols) {
    const contracts = CONTRACTS[symbol];
    if (!contracts) {
      console.log(`Unknown symbol: ${symbol}`);
      continue;
    }

    console.log(`\n=== ${symbol} ===`);

    for (const { chain, address } of contracts) {
      await backfillChain(symbol, chain, address);
    }

    await updateCounters(symbol);
  }

  console.log("\nBackfill complete!");
}

main().catch(console.error);
