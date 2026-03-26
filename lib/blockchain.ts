/**
 * On-chain data fetching for BRL stablecoins.
 * Calls RPC endpoints directly — no backend needed.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChainContract {
  chain: string;
  address: string;
}

interface StablecoinEntry {
  symbol: string;
  name: string;
  issuer: string;
  contracts: ChainContract[];
  defillamaId?: string;
  coingeckoId?: string;
}

export interface FetchedCoin {
  symbol: string;
  name: string;
  issuer: string;
  totalSupply: number;
  marketCapUsd: number;
  priceUsd: number;
  priceBrl: number;
  volume24hUsd: number;
  chains: { chain: string; supply: number; supplyUsd: number; percentage: number }[];
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const RPC_ENDPOINTS: Record<string, string> = {
  Ethereum: "https://eth.llamarpc.com",
  Polygon: "https://polygon-bor-rpc.publicnode.com",
  BSC: "https://bsc-dataseed1.binance.org",
  Celo: "https://forno.celo.org",
  Avalanche: "https://api.avax.network/ext/bc/C/rpc",
  Gnosis: "https://rpc.gnosischain.com",
  Base: "https://mainnet.base.org",
  Moonbeam: "https://rpc.api.moonbeam.network",
  Arbitrum: "https://arb1.arbitrum.io/rpc",
};

const REGISTRY: StablecoinEntry[] = [
  {
    symbol: "BRZ",
    name: "Brazilian Digital",
    issuer: "Transfero",
    defillamaId: "249",
    coingeckoId: "brz",
    contracts: [
      { chain: "Ethereum", address: "0x01d33fd36ec67c6ada32cf36b31e88ee190b1839" },
      { chain: "Polygon", address: "0x4eD141110F6EeeAbA9A1df36d8c26f684d2475Dc" },
      { chain: "BSC", address: "0x71be881e9C5d4465B3FfF61e89c6f3651E69B5bb" },
      { chain: "Avalanche", address: "0x491a4eb4f1fc3bff8e1d2fc856a6a46663ad556f" },
      { chain: "Gnosis", address: "0x0a06c8354A6CC1a07549a38701eAc205942E3Ac6" },
      { chain: "Arbitrum", address: "0xA8940698FdA5A07AbAEf4A5ccDf2f1Bb525B47A2" },
    ],
  },
  {
    symbol: "BRLA",
    name: "BRLA Digital",
    issuer: "BRLA Digital",
    contracts: [
      { chain: "Ethereum", address: "0x5ec84A2BF1B3843E1256E1BC2E498D83d6071e41" },
      { chain: "Polygon", address: "0xE6A537a407488807F0bbeb0038B79004f19DDDFb" },
      { chain: "Moonbeam", address: "0xfeB25F3fDDad13F82C4d6dbc1481516F62236429" },
    ],
  },
  {
    symbol: "BRLV",
    name: "Crown (BRLV)",
    issuer: "Crown",
    contracts: [
      { chain: "Base", address: "0x57323Db6d883811C17877d075e05AD9E2ED41519" },
    ],
  },
  {
    symbol: "ABRL",
    name: "ABRL (AMFI)",
    issuer: "AMFI",
    contracts: [
      { chain: "Polygon", address: "0x5acad7EDCcD4846F99335E26a7e6398D869dEc4f" },
    ],
  },
  {
    symbol: "BRL1",
    name: "BRL1",
    issuer: "Unknown",
    contracts: [
      { chain: "Polygon", address: "0x5C067C80C00eCd2345b05E83A3e758eF799C40B5" },
    ],
  },
  {
    symbol: "BBRL",
    name: "BBRL",
    issuer: "BBRL",
    contracts: [
      { chain: "Polygon", address: "0x0B28f768BA2448c402c8A48b03e9dB3dD1eAF84E" },
    ],
  },
  {
    symbol: "BRLC",
    name: "Celo Real",
    issuer: "Celo",
    contracts: [
      { chain: "Celo", address: "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787" },
    ],
  },
];

// ---------------------------------------------------------------------------
// RPC helpers
// ---------------------------------------------------------------------------

async function rpcCall(rpcUrl: string, to: string, data: string): Promise<string> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to, data }, "latest"],
    }),
  });
  const json = await res.json();
  return json.result ?? "0x0";
}

async function getDecimals(rpcUrl: string, address: string): Promise<number> {
  try {
    const result = await rpcCall(rpcUrl, address, "0x313ce567");
    if (result === "0x" || result === "0x0") return 18;
    return parseInt(result, 16);
  } catch {
    return 18;
  }
}

async function getTotalSupply(chain: string, address: string): Promise<number | null> {
  const rpcUrl = RPC_ENDPOINTS[chain];
  if (!rpcUrl || !address) return null;

  try {
    const [supplyHex, decimals] = await Promise.all([
      rpcCall(rpcUrl, address, "0x18160ddd"),
      getDecimals(rpcUrl, address),
    ]);
    if (supplyHex === "0x" || supplyHex === "0x0") return null;
    const raw = BigInt(supplyHex);
    return Number(raw) / 10 ** decimals;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// DeFiLlama
// ---------------------------------------------------------------------------

interface DefiLlamaAsset {
  id: number;
  name: string;
  symbol: string;
  price: number;
  circulating: Record<string, { peggedREAL?: number }>;
  chainCirculating: Record<string, { current: { peggedREAL?: number } }>;
}

async function fetchDefiLlamaBRL(): Promise<DefiLlamaAsset[]> {
  try {
    const res = await fetch(
      "https://stablecoins.llama.fi/stablecoins?includePrices=true",
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    return (data.peggedAssets ?? []).filter(
      (a: any) => a.pegType === "peggedREAL"
    );
  } catch {
    return [];
  }
}

async function fetchDefiLlamaDetail(id: string) {
  try {
    const res = await fetch(`https://stablecoins.llama.fi/stablecoin/${id}`);
    return await res.json();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// CoinGecko
// ---------------------------------------------------------------------------

async function fetchCoinGecko(coinId: string) {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const cache: Record<string, CacheEntry<any>> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    delete cache[key];
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T) {
  cache[key] = { data, ts: Date.now() };
}

// ---------------------------------------------------------------------------
// Main fetcher
// ---------------------------------------------------------------------------

export async function fetchAllStablecoins(): Promise<FetchedCoin[]> {
  const cached = getCached<FetchedCoin[]>("all_coins");
  if (cached) return cached;

  // 1. Fetch CoinGecko for BRZ (has price + volume)
  const cgBrz = await fetchCoinGecko("brz").catch(() => null);
  const brzPriceUsd = cgBrz?.market_data?.current_price?.usd ?? 0.19;
  const brzVolume = cgBrz?.market_data?.total_volume?.usd ?? 0;

  // 2. Fetch all on-chain supplies in parallel
  const results: FetchedCoin[] = [];

  const promises = REGISTRY.map(async (entry) => {
    const chainResults: { chain: string; supply: number }[] = [];
    let totalSupply = 0;

    // Fetch all chains in parallel
    const chainPromises = entry.contracts.map(async (cc) => {
      const supply = await getTotalSupply(cc.chain, cc.address);
      if (supply !== null && supply > 0) {
        chainResults.push({ chain: cc.chain, supply });
        totalSupply += supply;
      }
    });
    await Promise.all(chainPromises);

    const priceUsd = entry.coingeckoId === "brz" ? brzPriceUsd : brzPriceUsd; // approximate
    const volume = entry.coingeckoId === "brz" ? brzVolume : 0;

    const chains = chainResults.map((cr) => ({
      chain: cr.chain,
      supply: cr.supply,
      supplyUsd: cr.supply * priceUsd,
      percentage: totalSupply > 0 ? (cr.supply / totalSupply) * 100 : 0,
    }));

    return {
      symbol: entry.symbol,
      name: entry.name,
      issuer: entry.issuer,
      totalSupply,
      marketCapUsd: totalSupply * priceUsd,
      priceUsd,
      priceBrl: 1.0,
      volume24hUsd: volume,
      chains,
    } satisfies FetchedCoin;
  });

  const coins = await Promise.all(promises);
  // Also try to get DeFiLlama data for additional coins
  try {
    const llamaAssets = await fetchDefiLlamaBRL();
    for (const asset of llamaAssets) {
      const existing = coins.find(
        (c) => c.symbol.toUpperCase() === asset.symbol?.toUpperCase()
      );
      if (existing) {
        // Supplement with DeFiLlama price if available
        if (asset.price && asset.price > 0) {
          existing.priceUsd = asset.price;
          existing.marketCapUsd = existing.totalSupply * asset.price;
        }
      }
    }
  } catch { /* ignore */ }

  const sorted = coins
    .filter((c) => c.totalSupply > 0)
    .sort((a, b) => b.marketCapUsd - a.marketCapUsd);

  setCache("all_coins", sorted);
  return sorted;
}

export function getRegistry() {
  return REGISTRY;
}
