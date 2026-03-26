/**
 * Fetch token transfer activity from Blockscout APIs.
 * All data is real on-chain data, nothing estimated.
 * Uses time-bounded fetching to stay within serverless timeouts.
 */

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

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

// Max time per chain to fetch transfers (in ms)
// Vercel serverless has 60s max; leave room for processing + counters
const MAX_FETCH_TIME_MS = 40_000;

interface Transfer {
  date: string;
  value: number;
  from: string;
  to: string;
}

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

interface CacheEntry {
  data: { daily: DailyActivity[]; counters: TokenCounters };
  ts: number;
}

const cache: Record<string, CacheEntry> = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// Blockscout fetching with time budget
// ---------------------------------------------------------------------------

async function fetchTransfers(
  apiBase: string,
  contractAddress: string,
  timeBudgetMs: number
): Promise<Transfer[]> {
  const all: Transfer[] = [];
  const url = `${apiBase}/tokens/${contractAddress}/transfers`;
  let params: Record<string, string> = {};
  const startTime = Date.now();
  const MIN_DATE = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  for (let page = 0; page < 500; page++) {
    // Check time budget
    if (Date.now() - startTime > timeBudgetMs) break;

    try {
      const qs = new URLSearchParams(params).toString();
      const fullUrl = qs ? `${url}?${qs}` : url;
      const res = await fetch(fullUrl);
      if (!res.ok) break;
      const data = await res.json();
      const items = data.items ?? [];
      if (items.length === 0) break;

      let reachedCutoff = false;
      for (const tx of items) {
        const from = tx.from?.hash ?? "";
        const to = tx.to?.hash ?? "";
        const total = tx.total ?? {};
        const decimals = parseInt(total.decimals ?? "18", 10);
        const value = parseInt(total.value ?? "0", 10) / 10 ** decimals;
        const date = (tx.timestamp ?? "").slice(0, 10);
        if (!date) continue;
        if (date < MIN_DATE) { reachedCutoff = true; break; }
        all.push({ date, value, from: from.toLowerCase(), to: to.toLowerCase() });
      }

      if (reachedCutoff) break;
      const np = data.next_page_params;
      if (!np) break;
      params = {};
      for (const [k, v] of Object.entries(np)) params[k] = String(v);
    } catch {
      break;
    }
  }

  return all;
}

async function fetchCounters(chain: string, contractAddress: string): Promise<TokenCounters> {
  const apiBase = BLOCKSCOUT_URLS[chain];
  if (!apiBase) return { holders: 0, totalTransfers: 0 };
  try {
    const res = await fetch(`${apiBase}/tokens/${contractAddress}/counters`);
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

// ---------------------------------------------------------------------------
// Processing
// ---------------------------------------------------------------------------

function processTransfers(transfers: Transfer[]): DailyActivity[] {
  const dailyMint: Record<string, number> = {};
  const dailyBurn: Record<string, number> = {};
  const dailyTrades: Record<string, number> = {};
  const dailyWallets: Record<string, Set<string>> = {};
  const seenWallets = new Set<string>();
  const dailyNewWallets: Record<string, number> = {};

  const sorted = [...transfers].sort((a, b) => a.date.localeCompare(b.date));

  for (const tx of sorted) {
    const { date, value, from, to } = tx;
    if (!dailyWallets[date]) dailyWallets[date] = new Set();

    if (from === ZERO_ADDR) {
      dailyMint[date] = (dailyMint[date] ?? 0) + value;
      dailyWallets[date].add(to);
      if (!seenWallets.has(to)) { dailyNewWallets[date] = (dailyNewWallets[date] ?? 0) + 1; seenWallets.add(to); }
    } else if (to === ZERO_ADDR) {
      dailyBurn[date] = (dailyBurn[date] ?? 0) + value;
      dailyWallets[date].add(from);
      if (!seenWallets.has(from)) { dailyNewWallets[date] = (dailyNewWallets[date] ?? 0) + 1; seenWallets.add(from); }
    } else {
      dailyTrades[date] = (dailyTrades[date] ?? 0) + 1;
      dailyWallets[date].add(from);
      dailyWallets[date].add(to);
      for (const addr of [from, to]) {
        if (!seenWallets.has(addr)) { dailyNewWallets[date] = (dailyNewWallets[date] ?? 0) + 1; seenWallets.add(addr); }
      }
    }
  }

  const allDates = new Set([
    ...Object.keys(dailyMint), ...Object.keys(dailyBurn),
    ...Object.keys(dailyTrades), ...Object.keys(dailyWallets),
  ]);

  return Array.from(allDates).sort().map((date) => ({
    date,
    mint: dailyMint[date] ?? 0,
    burn: dailyBurn[date] ?? 0,
    trades: dailyTrades[date] ?? 0,
    newWallets: dailyNewWallets[date] ?? 0,
    activeWallets: dailyWallets[date]?.size ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function getTokenActivity(
  symbol: string
): Promise<{ daily: DailyActivity[]; counters: TokenCounters }> {
  const key = symbol.toUpperCase();

  const cached = cache[key];
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  const contracts = CONTRACTS[key];
  if (!contracts || contracts.length === 0) {
    return { daily: [], counters: { holders: 0, totalTransfers: 0 } };
  }

  // Split time budget across chains
  const timeBudgetPerChain = Math.floor(MAX_FETCH_TIME_MS / contracts.length);

  let allTransfers: Transfer[] = [];
  let totalHolders = 0;
  let totalTransferCount = 0;

  for (const { chain, address } of contracts) {
    const apiBase = BLOCKSCOUT_URLS[chain];
    if (!apiBase) continue;

    const [transfers, counters] = await Promise.all([
      fetchTransfers(apiBase, address, timeBudgetPerChain),
      fetchCounters(chain, address),
    ]);

    allTransfers = allTransfers.concat(transfers);
    totalHolders += counters.holders;
    totalTransferCount += counters.totalTransfers;
  }

  const daily = processTransfers(allTransfers);
  const counters = { holders: totalHolders, totalTransfers: totalTransferCount };
  const result = { daily, counters };

  cache[key] = { data: result, ts: Date.now() };
  return result;
}
