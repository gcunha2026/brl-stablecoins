import {
  OverviewData,
  Stablecoin,
  SupplyDataPoint,
  ChainData,
  MintBurnDataPoint,
  Pool,
  StablecoinDetail,
} from "./types";

export const mockOverview: OverviewData = {
  totalMarketCap: 1_280_000_000,
  marketCapChange24h: 2.34,
  totalSupply: 1_285_000_000,
  supplyChange24h: 1.12,
  totalHolders: 342_500,
  holdersChange24h: 0.87,
  volume24h: 89_400_000,
  volumeChange24h: -3.21,
};

export const mockStablecoins: Stablecoin[] = [
  {
    symbol: "BRZ",
    name: "Brazilian Digital Token",
    supply: 845_000_000,
    marketCap: 843_000_000,
    volume24h: 52_300_000,
    price: 0.998,
    priceChange24h: 0.02,
    chains: ["Ethereum", "Polygon", "Solana", "BNB Chain", "Stellar"],
    change7d: 3.45,
    color: "#00D4AA",
  },
  {
    symbol: "BRLC",
    name: "BRL Coin",
    supply: 215_000_000,
    marketCap: 214_500_000,
    volume24h: 18_700_000,
    price: 0.997,
    priceChange24h: -0.01,
    chains: ["Ethereum", "Polygon"],
    change7d: 1.23,
    color: "#7C3AED",
  },
  {
    symbol: "DREX",
    name: "Real Digital (DREX)",
    supply: 125_000_000,
    marketCap: 125_000_000,
    volume24h: 12_400_000,
    price: 1.0,
    priceChange24h: 0.0,
    chains: ["Hyperledger Besu"],
    change7d: 5.67,
    color: "#00B4D8",
  },
  {
    symbol: "cREAL",
    name: "Celo Real",
    supply: 78_000_000,
    marketCap: 77_800_000,
    volume24h: 4_200_000,
    price: 0.997,
    priceChange24h: -0.03,
    chains: ["Celo"],
    change7d: -1.89,
    color: "#EC4899",
  },
  {
    symbol: "BRLx",
    name: "BRLx Superfluid",
    supply: 22_000_000,
    marketCap: 21_900_000,
    volume24h: 1_800_000,
    price: 0.995,
    priceChange24h: 0.05,
    chains: ["Polygon", "Ethereum"],
    change7d: 0.45,
    color: "#F59E0B",
  },
];

function generateSupplyHistory(days: number): SupplyDataPoint[] {
  const data: SupplyDataPoint[] = [];
  const now = new Date();
  let baseBrz = 780_000_000;
  let baseBrlc = 190_000_000;
  let baseDrex = 95_000_000;
  let baseCreal = 68_000_000;
  let baseBrlx = 18_000_000;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    baseBrz += Math.random() * 2_000_000 - 800_000;
    baseBrlc += Math.random() * 800_000 - 300_000;
    baseDrex += Math.random() * 1_000_000 - 200_000;
    baseCreal += Math.random() * 400_000 - 200_000;
    baseBrlx += Math.random() * 150_000 - 60_000;

    data.push({
      date: date.toISOString().split("T")[0],
      brz: Math.round(baseBrz),
      brlc: Math.round(baseBrlc),
      drex: Math.round(baseDrex),
      creal: Math.round(baseCreal),
      brlx: Math.round(baseBrlx),
      total: Math.round(baseBrz + baseBrlc + baseDrex + baseCreal + baseBrlx),
    });
  }
  return data;
}

export const mockSupplyHistory: Record<string, SupplyDataPoint[]> = {
  "7d": generateSupplyHistory(7),
  "30d": generateSupplyHistory(30),
  "90d": generateSupplyHistory(90),
  "1y": generateSupplyHistory(365),
  all: generateSupplyHistory(730),
};

export const mockChainData: ChainData[] = [
  { chain: "Ethereum", supply: 520_000_000, color: "#627EEA" },
  { chain: "Polygon", supply: 310_000_000, color: "#8247E5" },
  { chain: "Solana", supply: 180_000_000, color: "#00D4AA" },
  { chain: "BNB Chain", supply: 125_000_000, color: "#F3BA2F" },
  { chain: "Celo", supply: 78_000_000, color: "#35D07F" },
  { chain: "Stellar", supply: 42_000_000, color: "#00B4D8" },
  { chain: "Hyperledger Besu", supply: 30_000_000, color: "#EC4899" },
];

function generateMintBurn(days: number): MintBurnDataPoint[] {
  const data: MintBurnDataPoint[] = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split("T")[0],
      mint: Math.round(Math.random() * 8_000_000 + 2_000_000),
      burn: Math.round(Math.random() * 5_000_000 + 1_000_000),
    });
  }
  return data;
}

export const mockMintBurnHistory = generateMintBurn(30);

export const mockPools: Pool[] = [
  {
    protocol: "Uniswap V3",
    chain: "Ethereum",
    pair: "BRZ/USDC",
    tvl: 24_500_000,
    volume24h: 8_200_000,
    apy: 12.4,
  },
  {
    protocol: "Curve",
    chain: "Ethereum",
    pair: "BRZ/USDT",
    tvl: 18_300_000,
    volume24h: 5_600_000,
    apy: 8.7,
  },
  {
    protocol: "QuickSwap",
    chain: "Polygon",
    pair: "BRZ/USDC",
    tvl: 12_100_000,
    volume24h: 3_400_000,
    apy: 15.2,
  },
  {
    protocol: "Orca",
    chain: "Solana",
    pair: "BRZ/USDC",
    tvl: 9_800_000,
    volume24h: 4_100_000,
    apy: 18.6,
  },
  {
    protocol: "PancakeSwap",
    chain: "BNB Chain",
    pair: "BRZ/BUSD",
    tvl: 7_200_000,
    volume24h: 2_100_000,
    apy: 11.3,
  },
  {
    protocol: "Ubeswap",
    chain: "Celo",
    pair: "cREAL/cUSD",
    tvl: 5_400_000,
    volume24h: 980_000,
    apy: 9.8,
  },
  {
    protocol: "SushiSwap",
    chain: "Polygon",
    pair: "BRLC/USDC",
    tvl: 4_100_000,
    volume24h: 1_200_000,
    apy: 14.1,
  },
  {
    protocol: "Raydium",
    chain: "Solana",
    pair: "BRZ/SOL",
    tvl: 3_600_000,
    volume24h: 1_800_000,
    apy: 22.5,
  },
];

export function getMockStablecoinDetail(symbol: string): StablecoinDetail {
  const coin = mockStablecoins.find(
    (s) => s.symbol.toLowerCase() === symbol.toLowerCase()
  );
  if (!coin) {
    return getMockStablecoinDetail("BRZ");
  }

  const supplyHistory: { date: string; value: number }[] = [];
  const now = new Date();
  let base = coin.supply * 0.85;
  for (let i = 90; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    base += Math.random() * (coin.supply * 0.005) - coin.supply * 0.002;
    supplyHistory.push({
      date: date.toISOString().split("T")[0],
      value: Math.round(base),
    });
  }

  return {
    symbol: coin.symbol,
    name: coin.name,
    supply: coin.supply,
    marketCap: coin.marketCap,
    price: coin.price,
    priceChange24h: coin.priceChange24h,
    volume24h: coin.volume24h,
    holders: Math.round(Math.random() * 100_000 + 20_000),
    chains: coin.chains,
    description: `${coin.name} (${coin.symbol}) is a BRL-pegged stablecoin operating across ${coin.chains.length} blockchain(s).`,
    website: `https://${coin.symbol.toLowerCase()}.finance`,
    supplyHistory,
    chainBreakdown: coin.chains.map((chain, i) => ({
      chain,
      supply: Math.round(coin.supply / coin.chains.length + Math.random() * coin.supply * 0.1),
      color: ["#00D4AA", "#7C3AED", "#00B4D8", "#EC4899", "#F59E0B"][i % 5],
    })),
    mintBurnHistory: generateMintBurn(30),
    pools: mockPools.filter((p) =>
      p.pair.toLowerCase().includes(coin.symbol.toLowerCase())
    ),
  };
}
