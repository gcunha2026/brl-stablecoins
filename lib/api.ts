import {
  OverviewData,
  Stablecoin,
  SupplyDataPoint,
  ChainData,
  Pool,
  StablecoinDetail,
  Period,
} from "./types";
import {
  mockOverview,
  mockStablecoins,
  mockSupplyHistory,
  mockChainData,
  mockPools,
  getMockStablecoinDetail,
} from "./mock-data";

const COIN_COLORS: Record<string, string> = {
  BRZ: "#22c55e",
  BRLA: "#3b82f6",
  BRLV: "#f59e0b",
  ABRL: "#8b5cf6",
  BRL1: "#ef4444",
  BRAZA: "#06b6d4",
  BBRL: "#10b981",
  BRLC: "#ec4899",
  BRLx: "#14b8a6",
  cBRL: "#f97316",
  BRTH: "#6366f1",
  BRLm: "#84cc16",
};

const CHAIN_COLORS: Record<string, string> = {
  Polygon: "#8247E5",
  Base: "#0052FF",
  Ethereum: "#627EEA",
  BSC: "#F3BA2F",
  Celo: "#35D07F",
  Moonbeam: "#53CBC8",
  Gnosis: "#04795B",
  Solana: "#9945FF",
  Arbitrum: "#28A0F0",
  Avalanche: "#E84142",
};

function apiBase(): string {
  if (typeof window !== "undefined") return ""; // client-side: relative URL
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function fetchOverview(): Promise<OverviewData> {
  try {
    const res = await fetch(`${apiBase()}/api/overview`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      totalMarketCap: data.total_market_cap_usd ?? 0,
      marketCapChange24h: 0,
      totalSupply: data.total_supply ?? 0,
      supplyChange24h: 0,
      totalHolders: data.total_holders ?? 0,
      holdersChange24h: 0,
      volume24h: data.total_volume_24h_usd ?? 0,
      volumeChange24h: 0,
    };
  } catch {
    return mockOverview;
  }
}

export async function fetchStablecoins(): Promise<Stablecoin[]> {
  try {
    const res = await fetch(`${apiBase()}/api/stablecoins`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.map((c: any) => ({
      symbol: c.symbol,
      name: c.name,
      supply: c.totalSupply,
      marketCap: c.marketCapUsd,
      volume24h: c.volume24hUsd ?? 0,
      price: c.priceUsd,
      priceChange24h: 0,
      chains: (c.chains ?? []).map((ch: any) => ch.chain),
      change7d: 0,
      color: COIN_COLORS[c.symbol] ?? "#94a3b8",
    }));
  } catch {
    return mockStablecoins;
  }
}

export async function fetchStablecoinDetail(
  symbol: string
): Promise<StablecoinDetail> {
  try {
    const res = await fetch(`${apiBase()}/api/stablecoin/${symbol}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const c = await res.json();
    return {
      symbol: c.symbol,
      name: c.name,
      supply: c.total_supply,
      marketCap: c.market_cap_usd,
      price: c.price_usd,
      priceChange24h: 0,
      volume24h: c.volume_24h_usd ?? 0,
      holders: c.holders ?? 0,
      chains: (c.chains ?? []).map((ch: any) => ch.chain),
      description: "",
      website: "",
      supplyHistory: (c.supply_history ?? []).map((h: any) => ({
        date: h.date,
        value: h.total_supply,
      })),
      chainBreakdown: (c.chains ?? []).map((ch: any) => ({
        chain: ch.chain,
        supply: ch.supply,
        color: CHAIN_COLORS[ch.chain] ?? "#94a3b8",
      })),
      mintBurnHistory: [],
      pools: [],
    };
  } catch {
    return getMockStablecoinDetail(symbol);
  }
}

export async function fetchSupplyChart(
  period: Period,
  symbol?: string
): Promise<SupplyDataPoint[]> {
  // No historical data without a DB — return empty for now
  return mockSupplyHistory[period] ?? mockSupplyHistory["30d"];
}

export async function fetchChains(): Promise<ChainData[]> {
  try {
    const res = await fetch(`${apiBase()}/api/chains`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return (json.chains ?? []).map((ch: any) => ({
      chain: ch.chain,
      supply: ch.supply,
      color: CHAIN_COLORS[ch.chain] ?? "#94a3b8",
    }));
  } catch {
    return mockChainData;
  }
}

export async function fetchPools(): Promise<Pool[]> {
  return mockPools; // Pools require external indexer, use mock for now
}
