/**
 * Token activity data - reads from Supabase (backfilled data) with
 * fallback to Blockscout for tokens not yet in the database.
 *
 * SERVER-ONLY: Contains contract addresses that must not leak to the client.
 */
import "server-only";
import { supabase } from "./supabase";

const BLOCKSCOUT_URLS: Record<string, string> = {
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
  ],
  ABRL: [{ chain: "Polygon", address: "0x5acad7EDCcD4846F99335E26a7e6398D869dEc4f" }],
  BRL1: [{ chain: "Polygon", address: "0x5C067C80C00eCd2345b05E83A3e758eF799C40B5" }],
  BRLC: [{ chain: "Celo", address: "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787" }],
};

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

export interface DailyActivity {
  date: string;
  mint: number;
  burn: number;
  trades: number;
  newWallets: number;
  activeWallets: number;
}

export interface TokenCounters {
  holders: number;
  totalTransfers: number;
}

export interface ActivityResult {
  daily: DailyActivity[];
  byChain: Record<string, DailyActivity[]>;
  chains: string[];
  counters: TokenCounters;
}

// In-memory cache
interface CacheEntry {
  data: ActivityResult;
  ts: number;
}
const cache: Record<string, CacheEntry> = {};
const CACHE_TTL = 10 * 60 * 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Aggregate per-chain rows into a single daily series */
function aggregateDaily(byChain: Record<string, DailyActivity[]>): DailyActivity[] {
  const map = new Map<string, DailyActivity>();
  for (const rows of Object.values(byChain)) {
    for (const r of rows) {
      const existing = map.get(r.date);
      if (existing) {
        existing.mint += r.mint;
        existing.burn += r.burn;
        existing.trades += r.trades;
        existing.newWallets += r.newWallets;
        existing.activeWallets += r.activeWallets;
      } else {
        map.set(r.date, { ...r });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/** Get the list of chains a symbol has contracts on */
export function getChainsForSymbol(symbol: string): string[] {
  return (CONTRACTS[symbol.toUpperCase()] ?? []).map((c) => c.chain);
}

// ---------------------------------------------------------------------------
// Supabase reads
// ---------------------------------------------------------------------------

async function readFromSupabase(symbol: string): Promise<ActivityResult | null> {
  if (!supabase) return null;

  // Try per-chain rows first (new format)
  const { data: rows, error } = await supabase
    .from("daily_activity")
    .select("date, chain, mint_volume, burn_volume, trade_count, active_wallets, new_wallets")
    .eq("symbol", symbol.toUpperCase())
    .order("date", { ascending: true });

  if (error || !rows || rows.length === 0) return null;

  // Group by chain
  const byChain: Record<string, DailyActivity[]> = {};
  const legacyDaily: DailyActivity[] = [];

  for (const r of rows as any[]) {
    const entry: DailyActivity = {
      date: r.date,
      mint: r.mint_volume ?? 0,
      burn: r.burn_volume ?? 0,
      trades: r.trade_count ?? 0,
      newWallets: r.new_wallets ?? 0,
      activeWallets: r.active_wallets ?? 0,
    };

    const chain = r.chain ?? "ALL";
    if (chain === "ALL") {
      legacyDaily.push(entry);
    } else {
      if (!byChain[chain]) byChain[chain] = [];
      byChain[chain].push(entry);
    }
  }

  // Get counters
  const { data: counter } = await supabase
    .from("token_counters")
    .select("holders, total_transfers")
    .eq("symbol", symbol.toUpperCase())
    .single();

  const counters: TokenCounters = {
    holders: counter?.holders ?? 0,
    totalTransfers: counter?.total_transfers ?? 0,
  };

  const chains = Object.keys(byChain);

  // If we have per-chain data, aggregate it for `daily`
  if (chains.length > 0) {
    return {
      daily: aggregateDaily(byChain),
      byChain,
      chains,
      counters,
    };
  }

  // Otherwise use legacy aggregated rows
  return {
    daily: legacyDaily,
    byChain: {},
    chains: [],
    counters,
  };
}

// ---------------------------------------------------------------------------
// Blockscout fallback (time-limited, for tokens not yet backfilled)
// ---------------------------------------------------------------------------

async function fetchBlockscoutCounters(
  chain: string,
  address: string
): Promise<TokenCounters> {
  const apiBase = BLOCKSCOUT_URLS[chain];
  if (!apiBase) return { holders: 0, totalTransfers: 0 };
  try {
    const res = await fetch(`${apiBase}/tokens/${address}/counters`);
    if (!res.ok) return { holders: 0, totalTransfers: 0 };
    const data = await res.json();
    return {
      holders: parseInt(data.token_holders_count ?? "0", 10),
      totalTransfers: parseInt(data.transfers_count ?? "0", 10),
    };
  } catch {
    return { holders: 0, totalTransfers: 0 };
  }
}

async function fetchBlockscoutFallback(symbol: string): Promise<ActivityResult> {
  const contracts = CONTRACTS[symbol.toUpperCase()] ?? [];
  const MAX_TIME = 40_000;

  interface Transfer { date: string; value: number; from: string; to: string; chain: string }
  let allTransfers: Transfer[] = [];
  let totalHolders = 0;
  let totalTransferCount = 0;

  const timeBudget = Math.floor(MAX_TIME / Math.max(contracts.length, 1));

  for (const { chain, address } of contracts) {
    const apiBase = BLOCKSCOUT_URLS[chain];
    if (!apiBase) continue;

    const startTime = Date.now();
    let params: Record<string, string> = {};
    const url = `${apiBase}/tokens/${address}/transfers`;

    for (let page = 0; page < 500; page++) {
      if (Date.now() - startTime > timeBudget) break;
      try {
        const qs = new URLSearchParams(params).toString();
        const fullUrl = qs ? `${url}?${qs}` : url;
        const res = await fetch(fullUrl);
        if (!res.ok) break;
        const data = await res.json();
        const items = data.items ?? [];
        if (items.length === 0) break;

        for (const tx of items) {
          const from = (tx.from?.hash ?? "").toLowerCase();
          const to = (tx.to?.hash ?? "").toLowerCase();
          const total = tx.total ?? {};
          const decimals = parseInt(total.decimals ?? "18", 10);
          const value = parseInt(total.value ?? "0", 10) / 10 ** decimals;
          const date = (tx.timestamp ?? "").slice(0, 10);
          if (date) allTransfers.push({ date, value, from, to, chain });
        }

        const np = data.next_page_params;
        if (!np) break;
        params = {};
        for (const [k, v] of Object.entries(np)) params[k] = String(v);
      } catch { break; }
    }

    const counters = await fetchBlockscoutCounters(chain, address);
    totalHolders += counters.holders;
    totalTransferCount += counters.totalTransfers;
  }

  // Process transfers into per-chain daily aggregation
  const chainDailyMap: Record<string, Record<string, { mint: number; burn: number; trades: number; wallets: Set<string>; newW: number }>> = {};
  const seenWallets = new Set<string>();
  const sorted = allTransfers.sort((a, b) => a.date.localeCompare(b.date));

  for (const tx of sorted) {
    if (!chainDailyMap[tx.chain]) chainDailyMap[tx.chain] = {};
    const dayMap = chainDailyMap[tx.chain];
    if (!dayMap[tx.date]) dayMap[tx.date] = { mint: 0, burn: 0, trades: 0, wallets: new Set(), newW: 0 };
    const d = dayMap[tx.date];

    if (tx.from === ZERO_ADDR) {
      d.mint += tx.value; d.wallets.add(tx.to);
      if (!seenWallets.has(tx.to)) { d.newW++; seenWallets.add(tx.to); }
    } else if (tx.to === ZERO_ADDR) {
      d.burn += tx.value; d.wallets.add(tx.from);
      if (!seenWallets.has(tx.from)) { d.newW++; seenWallets.add(tx.from); }
    } else {
      d.trades++; d.wallets.add(tx.from); d.wallets.add(tx.to);
      for (const a of [tx.from, tx.to]) { if (!seenWallets.has(a)) { d.newW++; seenWallets.add(a); } }
    }
  }

  // Convert to ActivityResult format
  const byChain: Record<string, DailyActivity[]> = {};
  for (const [chain, dayMap] of Object.entries(chainDailyMap)) {
    byChain[chain] = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date, mint: d.mint, burn: d.burn, trades: d.trades,
        newWallets: d.newW, activeWallets: d.wallets.size,
      }));
  }

  return {
    daily: aggregateDaily(byChain),
    byChain,
    chains: Object.keys(byChain),
    counters: { holders: totalHolders, totalTransfers: totalTransferCount },
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function getTokenActivity(symbol: string): Promise<ActivityResult> {
  const key = symbol.toUpperCase();

  const cached = cache[key];
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  // Try Supabase first (fast, full history)
  const dbResult = await readFromSupabase(key);
  if (dbResult && dbResult.daily.length > 0) {
    // If DB has no per-chain data, fill in chains list from CONTRACTS
    if (dbResult.chains.length === 0) {
      dbResult.chains = getChainsForSymbol(key);
    }
    cache[key] = { data: dbResult, ts: Date.now() };
    return dbResult;
  }

  // Fallback to Blockscout (slow, limited history)
  const result = await fetchBlockscoutFallback(key);
  cache[key] = { data: result, ts: Date.now() };
  return result;
}
