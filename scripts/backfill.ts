/**
 * Backfill script - fetches ALL historical transfers using Blockscout v1 API
 * (etherscan-compatible) with 10,000 items per request + block-based pagination.
 *
 * Usage: npx tsx scripts/backfill.ts [SYMBOL]
 * Example: npx tsx --env-file=.env.local scripts/backfill.ts BRLA
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

const BLOCKSCOUT_V1: Record<string, string> = {
  Base: "https://base.blockscout.com/api",
  Polygon: "https://polygon.blockscout.com/api",
  Ethereum: "https://eth.blockscout.com/api",
  Celo: "https://celo.blockscout.com/api",
  Moonbeam: "https://moonbeam.blockscout.com/api",
  BSC: "https://bsc.blockscout.com/api",
  Avalanche: "https://avalanche.blockscout.com/api",
  Gnosis: "https://gnosis.blockscout.com/api",
  Arbitrum: "https://arbitrum.blockscout.com/api",
};

const BLOCKSCOUT_V2: Record<string, string> = {
  Base: "https://base.blockscout.com/api/v2",
  Polygon: "https://polygon.blockscout.com/api/v2",
  Ethereum: "https://eth.blockscout.com/api/v2",
  Celo: "https://celo.blockscout.com/api/v2",
  Moonbeam: "https://moonbeam.blockscout.com/api/v2",
  BSC: "https://bsc.blockscout.com/api/v2",
  Avalanche: "https://avalanche.blockscout.com/api/v2",
  Gnosis: "https://gnosis.blockscout.com/api/v2",
  Arbitrum: "https://arbitrum.blockscout.com/api/v2",
};

const CONTRACTS: Record<string, { chain: string; address: string }[]> = {
  BRLV: [{ chain: "Base", address: "0x57323Db6d883811C17877d075e05AD9E2ED41519" }],
  BRZ: [
    { chain: "Polygon", address: "0x4eD141110F6EeeAbA9A1df36d8c26f684d2475Dc" },
    { chain: "Ethereum", address: "0x01d33fd36ec67c6ada32cf36b31e88ee190b1839" },
    { chain: "BSC", address: "0x71be881e9C5d4465B3FfF61e89c6f3651E69B5bb" },
    { chain: "Avalanche", address: "0x491a4eb4f1fc3bff8e1d2fc856a6a46663ad556f" },
    { chain: "Arbitrum", address: "0xA8940698FdA5A07AbAEf4A5ccDf2f1Bb525B47A2" },
  ],
  BRLA: [
    { chain: "Polygon", address: "0xE6A537a407488807F0bbeb0038B79004f19DDDFb" },
    { chain: "Celo", address: "0xFECB3F7c54E2CAAE9dC6Ac9060A822D47E053760" },
    { chain: "Gnosis", address: "0xFECB3F7c54E2CAAE9dC6Ac9060A822D47E053760" },
    { chain: "Base", address: "0xfCB34c47f850f452C15EA1B84d51231C38A61783" },
    { chain: "Ethereum", address: "0xfCB34c47f850f452C15EA1B84d51231C38A61783" },
    // Moonbeam excluded: Blockscout API unreliable, <1% of supply
  ],
  ABRL: [{ chain: "Polygon", address: "0x5acad7EDCcD4846F99335E26a7e6398D869dEc4f" }],
  BRL1: [{ chain: "Polygon", address: "0x5C067C80C00eCd2345b05E83A3e758eF799C40B5" }],
  BRLC: [{ chain: "Celo", address: "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787" }],
};

const ZERO = "0x0000000000000000000000000000000000000000";
const BATCH_SIZE = 10000;

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
  symbol: string, chain: string, lastDate: string,
  totalFetched: number, status: string, endBlock?: number
) {
  await supabase.from("backfill_progress").upsert({
    symbol, chain,
    last_page_params: endBlock != null ? { endBlock } : null,
    last_date: lastDate,
    total_transfers_fetched: totalFetched,
    status,
    updated_at: new Date().toISOString(),
  }, { onConflict: "symbol,chain" });
}

async function saveDailyBatch(
  symbol: string, chain: string, dailyMap: Map<string, DailyAgg>, knownWallets: Set<string>
) {
  const rows = Array.from(dailyMap.entries()).map(([date, d]) => {
    let newCount = 0;
    for (const w of d.wallets) {
      if (!knownWallets.has(w)) { newCount++; knownWallets.add(w); }
    }
    return {
      symbol, chain, date,
      mint_count: d.mint_count, mint_volume: d.mint_volume,
      burn_count: d.burn_count, burn_volume: d.burn_volume,
      trade_count: d.trade_count,
      active_wallets: d.wallets.size,
      new_wallets: newCount,
    };
  });

  if (rows.length > 0) {
    const { error } = await supabase.from("daily_activity").upsert(rows, { onConflict: "symbol,chain,date" });
    if (error) console.error("  Error saving daily:", error.message);
  }

  // Save wallets in batches
  const walletRows: { symbol: string; wallet: string; first_seen: string }[] = [];
  for (const [date, d] of dailyMap.entries()) {
    for (const w of d.wallets) {
      walletRows.push({ symbol, wallet: w, first_seen: date });
    }
  }
  for (let i = 0; i < walletRows.length; i += 500) {
    await supabase.from("known_wallets").upsert(
      walletRows.slice(i, i + 500),
      { onConflict: "symbol,wallet", ignoreDuplicates: true }
    );
  }
}

async function backfillChain(symbol: string, chain: string, address: string) {
  const apiBase = BLOCKSCOUT_V1[chain];
  if (!apiBase) { console.log(`  Skipping ${chain}`); return; }

  const progress = await getProgress(symbol, chain);
  if (progress?.status === "done") {
    console.log(`  ${chain}: already done (${progress.total_transfers_fetched} transfers)`);
    return;
  }

  let endBlock = progress?.last_page_params?.endBlock ?? undefined;
  let totalFetched = progress?.total_transfers_fetched ?? 0;
  let lastDate = progress?.last_date ?? "";

  if (endBlock) {
    console.log(`  ${chain}: resuming from block ${endBlock} (${totalFetched} fetched, last: ${lastDate})`);
  } else {
    console.log(`  ${chain}: starting fresh`);
  }

  await saveProgress(symbol, chain, lastDate, totalFetched, "running", endBlock);

  // Load known wallets
  const { data: existingWallets } = await supabase
    .from("known_wallets").select("wallet").eq("symbol", symbol);
  const knownWallets = new Set((existingWallets ?? []).map((w: any) => w.wallet));

  const minTs = Math.floor(Date.now() / 1000) - 365 * 86400; // 1 year ago
  let batch = 0;
  let dailyMap = new Map<string, DailyAgg>();

  // Start with smaller batch if resuming (older blocks may have huge responses)
  let currentBatchSize = endBlock ? 2000 : BATCH_SIZE;

  while (true) {
    try {
      let url = `${apiBase}?module=account&action=tokentx&contractaddress=${address}&page=1&offset=${currentBatchSize}&sort=desc`;
      if (endBlock != null) url += `&endblock=${endBlock}`;

      const res = await fetch(url);
      let json: any;
      try {
        json = await res.json();
      } catch {
        // Response too large — reduce batch size
        if (currentBatchSize > 100) {
          currentBatchSize = Math.floor(currentBatchSize / 2);
          console.log(`    Response too large, reducing batch to ${currentBatchSize}`);
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        // Skip this chain entirely
        console.log(`    ${chain}: response too large even at batch 100, skipping chain`);
        await saveProgress(symbol, chain, lastDate, totalFetched, "done");
        return;
      }
      const items = json.result;

      if (!Array.isArray(items) || items.length === 0) break;

      let reachedCutoff = false;

      for (const tx of items) {
        const ts = parseInt(tx.timeStamp ?? "0", 10);
        if (ts < minTs) { reachedCutoff = true; break; }

        const date = new Date(ts * 1000).toISOString().slice(0, 10);
        const from = (tx.from ?? "").toLowerCase();
        const to = (tx.to ?? "").toLowerCase();
        const decimals = parseInt(tx.tokenDecimal ?? "18", 10);
        const value = parseInt(tx.value ?? "0", 10) / 10 ** decimals;

        if (!dailyMap.has(date)) dailyMap.set(date, newDay());
        const d = dailyMap.get(date)!;

        if (from === ZERO) {
          d.mint_count++; d.mint_volume += value; d.wallets.add(to);
        } else if (to === ZERO) {
          d.burn_count++; d.burn_volume += value; d.wallets.add(from);
        } else {
          d.trade_count++; d.wallets.add(from); d.wallets.add(to);
        }

        lastDate = date;
        totalFetched++;
      }

      // Get last block for next pagination
      const lastItem = items[items.length - 1];
      endBlock = parseInt(lastItem.blockNumber, 10) - 1;

      batch++;

      // Save every 5 batches (50k transfers)
      if (batch % 5 === 0 || reachedCutoff) {
        await saveDailyBatch(symbol, chain, dailyMap, knownWallets);
        dailyMap = new Map();
        await saveProgress(symbol, chain, lastDate, totalFetched, "running", endBlock);
        console.log(`    batch ${batch}: ${totalFetched.toLocaleString()} transfers, last: ${lastDate}`);
      }

      if (reachedCutoff) break;
      if (items.length < BATCH_SIZE) break; // last page

      // Small delay
      await new Promise(r => setTimeout(r, 500));
    } catch (err: any) {
      console.error(`    Error batch ${batch}: ${err.message}. Saving & retrying in 5s...`);
      await saveDailyBatch(symbol, chain, dailyMap, knownWallets);
      dailyMap = new Map();
      await saveProgress(symbol, chain, lastDate, totalFetched, "running", endBlock);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  // Final save
  await saveDailyBatch(symbol, chain, dailyMap, knownWallets);
  await saveProgress(symbol, chain, lastDate, totalFetched, "done");
  console.log(`  ${chain}: DONE - ${totalFetched.toLocaleString()} transfers, last: ${lastDate}`);
}

async function updateCounters(symbol: string) {
  const contracts = CONTRACTS[symbol] ?? [];
  let totalHolders = 0, totalTransfers = 0;

  for (const { chain, address } of contracts) {
    const apiBase = BLOCKSCOUT_V2[chain];
    if (!apiBase) continue;
    try {
      const res = await fetch(`${apiBase}/tokens/${address}/counters`);
      if (!res.ok) continue;
      const data = await res.json();
      totalHolders += parseInt(data.token_holders_count ?? "0", 10);
      totalTransfers += parseInt(data.transfers_count ?? "0", 10);
    } catch {}
  }

  await supabase.from("token_counters").upsert({
    symbol, holders: totalHolders, total_transfers: totalTransfers,
    updated_at: new Date().toISOString(),
  }, { onConflict: "symbol" });
  console.log(`  Counters: ${totalHolders.toLocaleString()} holders, ${totalTransfers.toLocaleString()} transfers`);
}

async function main() {
  const targetSymbol = process.argv[2]?.toUpperCase();
  const symbols = targetSymbol ? [targetSymbol] : Object.keys(CONTRACTS);

  for (const symbol of symbols) {
    const contracts = CONTRACTS[symbol];
    if (!contracts) { console.log(`Unknown: ${symbol}`); continue; }

    console.log(`\n=== ${symbol} ===`);
    for (const { chain, address } of contracts) {
      await backfillChain(symbol, chain, address);
    }
    await updateCounters(symbol);
  }

  console.log("\nBackfill complete!");
}

main().catch(console.error);
