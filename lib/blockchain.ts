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

// Treasury wallets per chain whose balances should be subtracted from totalSupply
interface TreasuryWallet {
  chain: string;
  token: string; // contract address of the token
  wallet: string; // treasury wallet address
}

// XRPL token config (non-EVM)
interface XrplToken {
  issuer: string;     // XRPL issuer address
  currency: string;   // currency code (e.g. "BBRL")
}

interface StablecoinEntry {
  symbol: string;
  name: string;
  issuer: string;
  contracts: ChainContract[];
  xrpl?: XrplToken;
  treasuryWallets?: TreasuryWallet[];
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
  XDC: "https://rpc.ankr.com/xdc",
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
      { chain: "Arbitrum", address: "0xA8940698FdA5A07AbAEf4A5ccDf2f1Bb525B47A2" },
    ],
    treasuryWallets: [
      // Transfero treasury (same wallets across chains)
      { chain: "Polygon", token: "0x4eD141110F6EeeAbA9A1df36d8c26f684d2475Dc", wallet: "0x68Aca8008f479637664A185e0Ffb874De2af6A0B" },
      { chain: "Polygon", token: "0x4eD141110F6EeeAbA9A1df36d8c26f684d2475Dc", wallet: "0xf89d7b9c864f589bbF53a82105107622B35EaA40" },
      { chain: "Ethereum", token: "0x01d33fd36ec67c6ada32cf36b31e88ee190b1839", wallet: "0x68Aca8008f479637664A185e0Ffb874De2af6A0B" },
      { chain: "Ethereum", token: "0x01d33fd36ec67c6ada32cf36b31e88ee190b1839", wallet: "0xf89d7b9c864f589bbF53a82105107622B35EaA40" },
      { chain: "Ethereum", token: "0x01d33fd36ec67c6ada32cf36b31e88ee190b1839", wallet: "0xcE98b8D126891b4B406addCd1Fe368772f325E04" },
      { chain: "Avalanche", token: "0x491a4eb4f1fc3bff8e1d2fc856a6a46663ad556f", wallet: "0xB90B2050C955cd899b9BC8B5C743c25770EBc8AA" },
    ],
  },
  {
    symbol: "BRLA",
    name: "BRLA Digital",
    issuer: "BRLA Digital / Avenia",
    contracts: [
      { chain: "Polygon", address: "0xE6A537a407488807F0bbeb0038B79004f19DDDFb" },
      { chain: "Celo", address: "0xFECB3F7c54E2CAAE9dC6Ac9060A822D47E053760" },
      { chain: "Gnosis", address: "0xFECB3F7c54E2CAAE9dC6Ac9060A822D47E053760" },
      { chain: "Moonbeam", address: "0xfeB25F3fDDad13F82C4d6dbc1481516F62236429" },
      { chain: "Base", address: "0xfCB34c47f850f452C15EA1B84d51231C38A61783" },
      { chain: "Ethereum", address: "0xfCB34c47f850f452C15EA1B84d51231C38A61783" },
    ],
    // No treasury subtraction: BRLA is 1:1 backed with audited reserves
    // totalSupply = total issued with BRL backing (Itau custody, UHY audited)
  },
  {
    symbol: "BRLV",
    name: "Crown (BRLV)",
    issuer: "Crown",
    contracts: [
      { chain: "Base", address: "0x57323Db6d883811C17877d075e05AD9E2ED41519" },
    ],
    // No treasury subtraction — proxy 0xd2047 is a functional vault, not issuer treasury
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
    treasuryWallets: [
      { chain: "Polygon", token: "0x5C067C80C00eCd2345b05E83A3e758eF799C40B5", wallet: "0x10E7D149e73daE219bb517De0FcB6A9601BA0f02" },
    ],
  },
  {
    symbol: "BRLD",
    name: "Brazil Real Digital",
    issuer: "Liqi",
    contracts: [
      { chain: "XDC", address: "0xfb67c0ca9366e5ae08ffed2f00de59d7e0537dfb" },
    ],
  },
  {
    symbol: "BBRL",
    name: "BBRL",
    issuer: "Braza Bank",
    contracts: [], // Polygon is institutional bridge only, not included
    xrpl: {
      issuer: "rP1rFtLizETzwySJQTRKzLk7F5ZH7NmPqv",
      currency: "BBRL",
    },
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

// Fallback RPCs for chains with unreliable primary
const FALLBACK_RPCS: Record<string, string[]> = {
  XDC: [
    "https://rpc.ankr.com/xdc",
    "https://erpc.xinfin.network",
    "https://rpc.xdc.org",
    "https://rpc1.xinfin.network",
  ],
};

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
  // Try primary RPC first, then fallbacks
  const rpcsToTry = [
    RPC_ENDPOINTS[chain],
    ...(FALLBACK_RPCS[chain] ?? []),
  ].filter(Boolean);

  for (const rpcUrl of rpcsToTry) {
    try {
      const [supplyHex, decimals] = await Promise.all([
        rpcCall(rpcUrl, address, "0x18160ddd"),
        getDecimals(rpcUrl, address),
      ]);
      if (supplyHex === "0x" || supplyHex === "0x0") continue;
      const raw = BigInt(supplyHex);
      const supply = Number(raw) / 10 ** decimals;
      if (supply > 0) return supply;
    } catch {
      continue;
    }
  }
  return null;
}

async function getBalanceOf(
  chain: string,
  tokenAddress: string,
  walletAddress: string
): Promise<number> {
  const rpcUrl = RPC_ENDPOINTS[chain];
  if (!rpcUrl) return 0;
  try {
    // balanceOf(address) selector = 0x70a08231 + padded address
    const paddedAddr = walletAddress.toLowerCase().replace("0x", "").padStart(64, "0");
    const data = "0x70a08231" + paddedAddr;
    const result = await rpcCall(rpcUrl, tokenAddress, data);
    if (result === "0x" || result === "0x0") return 0;
    const raw = BigInt(result);
    const decimals = await getDecimals(rpcUrl, tokenAddress);
    return Number(raw) / 10 ** decimals;
  } catch {
    return 0;
  }
}

async function getTreasuryBalance(entry: StablecoinEntry): Promise<number> {
  if (!entry.treasuryWallets || entry.treasuryWallets.length === 0) return 0;

  const promises = entry.treasuryWallets.map((tw) =>
    getBalanceOf(tw.chain, tw.token, tw.wallet)
  );
  const balances = await Promise.all(promises);
  return balances.reduce((sum, b) => sum + b, 0);
}

// ---------------------------------------------------------------------------
// XRPL helpers
// ---------------------------------------------------------------------------

const XRPL_RPC = "https://xrplcluster.com";

async function getXrplCirculatingSupply(
  issuer: string,
  currency: string
): Promise<{ supply: number; holders: number }> {
  try {
    // Paginate through all trust lines for this issuer
    let allLines: any[] = [];
    let marker: any = undefined;

    do {
      const params: any = {
        account: issuer,
        ledger_index: "validated",
        limit: 400,
      };
      if (marker) params.marker = marker;

      const res = await fetch(XRPL_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "account_lines", params: [params] }),
      });
      const json = await res.json();
      const result = json.result ?? {};
      const lines = result.lines ?? [];
      allLines = allLines.concat(lines);
      marker = result.marker;
    } while (marker);

    // Filter for the target currency
    // XRPL currency codes can be 3-char or 40-char hex
    const targetHex = Buffer.from(currency.padEnd(20, "\0")).toString("hex");

    let totalCirculating = 0;
    let holderCount = 0;

    for (const line of allLines) {
      const lineCurrency = line.currency ?? "";
      const isMatch =
        lineCurrency === currency ||
        lineCurrency.toLowerCase() === targetHex.toLowerCase();

      if (!isMatch) continue;

      // From issuer perspective: positive balance = peer holds tokens
      // (issuer owes them), negative = issuer holds tokens from peer
      const balance = parseFloat(line.balance ?? "0");
      if (balance > 0) {
        totalCirculating += balance;
        holderCount++;
      }
    }

    return { supply: totalCirculating, holders: holderCount };
  } catch {
    return { supply: 0, holders: 0 };
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

    // Fetch EVM chain supplies + treasury balances + XRPL in parallel
    const [, treasuryBalance, xrplData] = await Promise.all([
      Promise.all(
        entry.contracts.map(async (cc) => {
          const supply = await getTotalSupply(cc.chain, cc.address);
          if (supply !== null && supply > 0) {
            chainResults.push({ chain: cc.chain, supply });
            totalSupply += supply;
          }
        })
      ),
      getTreasuryBalance(entry),
      entry.xrpl
        ? getXrplCirculatingSupply(entry.xrpl.issuer, entry.xrpl.currency)
        : Promise.resolve({ supply: 0, holders: 0 }),
    ]);

    // Add XRPL supply if present
    if (xrplData.supply > 0) {
      chainResults.push({ chain: "XRPL", supply: xrplData.supply });
      totalSupply += xrplData.supply;
    }

    // Circulating supply = total EVM supply - treasury + XRPL (XRPL is already circulating)
    const evmSupply = chainResults
      .filter((c) => c.chain !== "XRPL")
      .reduce((s, c) => s + c.supply, 0);
    const evmCirculating = Math.max(0, evmSupply - treasuryBalance);
    const circulatingSupply = evmCirculating + xrplData.supply;

    const priceUsd = entry.coingeckoId === "brz" ? brzPriceUsd : brzPriceUsd;
    const volume = entry.coingeckoId === "brz" ? brzVolume : 0;

    // Recalculate EVM chain supplies proportionally if treasury was subtracted
    const evmRatio = evmSupply > 0 ? evmCirculating / evmSupply : 1;
    const chains = chainResults.map((cr) => {
      const adjSupply = cr.chain === "XRPL" ? cr.supply : cr.supply * evmRatio;
      return {
        chain: cr.chain,
        supply: adjSupply,
        supplyUsd: adjSupply * priceUsd,
        percentage: circulatingSupply > 0 ? (adjSupply / circulatingSupply) * 100 : 0,
      };
    });

    return {
      symbol: entry.symbol,
      name: entry.name,
      issuer: entry.issuer,
      totalSupply: circulatingSupply,
      marketCapUsd: circulatingSupply * priceUsd,
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
