/**
 * Token activity data - reads from Supabase (backfilled data) with
 * fallback to Blockscout for tokens not yet in the database.
 *
 * SERVER-ONLY: Contains contract addresses that must not leak to the client.
 */
import "server-only";
import { supabase } from "./supabase";
import { BLOCKSCOUT_V2, getBlockscoutContracts } from "./contracts";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

export interface DailyActivity {
  date: string;
  mint: number;
  burn: number;
  trades: number;
  tradeVolume: number;
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
        existing.tradeVolume += r.tradeVolume;
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
  return getBlockscoutContracts(symbol.toUpperCase()).map((c) => c.chain);
}

// ---------------------------------------------------------------------------
// Supabase reads
// ---------------------------------------------------------------------------

async function readFromSupabase(symbol: string): Promise<ActivityResult | null> {
  if (!supabase) return null;

  // Read raw per-(chain, address) rows. A single (chain, date) may have
  // multiple rows when a token has more than one contract on the chain;
  // we sum them below so the dashboard sees one entry per chain/date.
  //
  // Supabase REST caps at 1000 rows per request. Tokens with multi-year
  // history easily exceed that cap (BRLA had ~1363 rows mid-2026 and the
  // earlier .range()-based pagination silently returned only the first
  // 1000 in production, freezing the dashboard at the date where row 1000
  // landed). Paginate via the BIGSERIAL id instead so each call's filter
  // shrinks the candidate set monotonically.
  const PAGE = 1000;
  const rows: any[] = [];
  let lastId = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("daily_activity")
      .select("id, date, chain, mint_volume, burn_volume, trade_count, trade_volume, active_wallets, new_wallets")
      .eq("symbol", symbol.toUpperCase())
      .gt("id", lastId)
      .order("id", { ascending: true })
      .limit(PAGE);
    if (error) return null;
    if (!data || data.length === 0) break;
    rows.push(...data);
    lastId = data[data.length - 1].id;
    if (data.length < PAGE) break;
  }
  if (rows.length === 0) return null;

  // Group by (chain, date), summing across deployment addresses
  const byChainMap: Record<string, Map<string, DailyActivity>> = {};
  const legacyDaily: DailyActivity[] = [];

  for (const r of rows as any[]) {
    const chain = r.chain ?? "ALL";
    const entry: DailyActivity = {
      date: r.date,
      mint: r.mint_volume ?? 0,
      burn: r.burn_volume ?? 0,
      trades: r.trade_count ?? 0,
      tradeVolume: r.trade_volume ?? 0,
      newWallets: r.new_wallets ?? 0,
      activeWallets: r.active_wallets ?? 0,
    };

    if (chain === "ALL") {
      legacyDaily.push(entry);
      continue;
    }

    if (!byChainMap[chain]) byChainMap[chain] = new Map();
    const m = byChainMap[chain];
    const existing = m.get(r.date);
    if (existing) {
      existing.mint += entry.mint;
      existing.burn += entry.burn;
      existing.trades += entry.trades;
      existing.tradeVolume += entry.tradeVolume;
      existing.newWallets += entry.newWallets;
      existing.activeWallets += entry.activeWallets;
    } else {
      m.set(r.date, entry);
    }
  }

  const byChain: Record<string, DailyActivity[]> = {};
  for (const [chain, m] of Object.entries(byChainMap)) {
    byChain[chain] = Array.from(m.values()).sort((a, b) => a.date.localeCompare(b.date));
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
  const apiBase = BLOCKSCOUT_V2[chain];
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
  const contracts = getBlockscoutContracts(symbol.toUpperCase());
  const MAX_TIME = 40_000;

  interface Transfer { date: string; value: number; from: string; to: string; chain: string }
  let allTransfers: Transfer[] = [];
  let totalHolders = 0;
  let totalTransferCount = 0;

  const timeBudget = Math.floor(MAX_TIME / Math.max(contracts.length, 1));

  for (const { chain, address } of contracts) {
    const apiBase = BLOCKSCOUT_V2[chain];
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
  const chainDailyMap: Record<string, Record<string, { mint: number; burn: number; trades: number; tradeVolume: number; wallets: Set<string>; newW: number }>> = {};
  const seenWallets = new Set<string>();
  const sorted = allTransfers.sort((a, b) => a.date.localeCompare(b.date));

  for (const tx of sorted) {
    if (!chainDailyMap[tx.chain]) chainDailyMap[tx.chain] = {};
    const dayMap = chainDailyMap[tx.chain];
    if (!dayMap[tx.date]) dayMap[tx.date] = { mint: 0, burn: 0, trades: 0, tradeVolume: 0, wallets: new Set(), newW: 0 };
    const d = dayMap[tx.date];

    if (tx.from === ZERO_ADDR) {
      d.mint += tx.value; d.wallets.add(tx.to);
      if (!seenWallets.has(tx.to)) { d.newW++; seenWallets.add(tx.to); }
    } else if (tx.to === ZERO_ADDR) {
      d.burn += tx.value; d.wallets.add(tx.from);
      if (!seenWallets.has(tx.from)) { d.newW++; seenWallets.add(tx.from); }
    } else {
      d.trades++; d.tradeVolume += tx.value;
      d.wallets.add(tx.from); d.wallets.add(tx.to);
      for (const a of [tx.from, tx.to]) { if (!seenWallets.has(a)) { d.newW++; seenWallets.add(a); } }
    }
  }

  // Convert to ActivityResult format
  const byChain: Record<string, DailyActivity[]> = {};
  for (const [chain, dayMap] of Object.entries(chainDailyMap)) {
    byChain[chain] = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date, mint: d.mint, burn: d.burn,
        trades: d.trades, tradeVolume: d.tradeVolume,
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
    // If DB has no per-chain data, fill in chains list from registry
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
