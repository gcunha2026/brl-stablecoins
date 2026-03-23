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

const API_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const USE_MOCK = true; // Set to false when backend is available

async function fetchJSON<T>(url: string, fallback: T): Promise<T> {
  if (USE_MOCK) return fallback;
  try {
    const res = await fetch(`${API_BASE}${url}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    console.warn(`API fetch failed for ${url}, using mock data`);
    return fallback;
  }
}

export async function fetchOverview(): Promise<OverviewData> {
  return fetchJSON("/api/overview", mockOverview);
}

export async function fetchStablecoins(): Promise<Stablecoin[]> {
  return fetchJSON("/api/stablecoins", mockStablecoins);
}

export async function fetchStablecoinDetail(
  symbol: string
): Promise<StablecoinDetail> {
  return fetchJSON(
    `/api/stablecoins/${symbol}`,
    getMockStablecoinDetail(symbol)
  );
}

export async function fetchSupplyChart(
  period: Period,
  symbol?: string
): Promise<SupplyDataPoint[]> {
  const query = symbol ? `?symbol=${symbol}` : "";
  return fetchJSON(
    `/api/supply-chart/${period}${query}`,
    mockSupplyHistory[period] || mockSupplyHistory["30d"]
  );
}

export async function fetchChains(): Promise<ChainData[]> {
  return fetchJSON("/api/chains", mockChainData);
}

export async function fetchPools(): Promise<Pool[]> {
  return fetchJSON("/api/pools", mockPools);
}
