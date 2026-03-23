import {
  OverviewData,
  Stablecoin,
  SupplyDataPoint,
  ChainData,
  MintBurnDataPoint,
  Pool,
  StablecoinDetail,
} from "./types";

// Real data from DeFiLlama + Iporanga (Mar 2026)
// BRZ total: 1.37B BRL (~$260M USD) — dominates the market
// Iporanga shows ~$90M but likely excludes Gnosis chain or uses different methodology
export const mockOverview: OverviewData = {
  totalMarketCap: 262_000_000, // USD - based on DeFiLlama real data
  marketCapChange24h: 1.42,
  totalSupply: 1_380_000_000, // BRL - all BRL stablecoins combined
  supplyChange24h: 0.78,
  totalHolders: 106_200, // from Iporanga
  holdersChange24h: 0.52,
  volume24h: 15_320_000,
  volumeChange24h: -1.85,
};

// Supply values in BRL, marketCap/volume in USD
// Source: DeFiLlama peggedREAL + Iporanga token list
export const mockStablecoins: Stablecoin[] = [
  {
    symbol: "BRZ",
    name: "BRZ (Transfero)",
    supply: 1_367_000_000, // DeFiLlama: 1.37B BRL
    marketCap: 259_800_000, // ~$260M USD at $0.19
    volume24h: 8_400_000,
    price: 0.19,
    priceChange24h: 0.03,
    chains: [
      "Gnosis",
      "Solana",
      "Polygon",
      "Ethereum",
      "Base",
      "BNB Chain",
      "Avalanche",
      "Celo",
      "OP Mainnet",
      "Moonbeam",
      "Mantle",
      "Arbitrum",
    ],
    change7d: 2.18,
    color: "#00D4AA",
  },
  {
    symbol: "BRLA",
    name: "BRLA Digital",
    supply: 8_200_000, // estimated from Iporanga pool data
    marketCap: 1_560_000,
    volume24h: 1_200_000,
    price: 0.19,
    priceChange24h: -0.01,
    chains: ["Ethereum", "Polygon"],
    change7d: 5.32,
    color: "#7C3AED",
  },
  {
    symbol: "BRL1",
    name: "BRL1 (Num Finance)",
    supply: 2_400_000, // estimated from Iporanga pool data (low TVL pools)
    marketCap: 456_000,
    volume24h: 85_000,
    price: 0.19,
    priceChange24h: 0.01,
    chains: ["Polygon"],
    change7d: 1.45,
    color: "#00B4D8",
  },
  {
    symbol: "BBRL",
    name: "BBRL",
    supply: 1_800_000,
    marketCap: 342_000,
    volume24h: 42_000,
    price: 0.19,
    priceChange24h: -0.02,
    chains: ["Ethereum", "Polygon"],
    change7d: -0.87,
    color: "#F59E0B",
  },
  {
    symbol: "BRLm",
    name: "Mento Brazilian Real",
    supply: 1_205_000, // DeFiLlama: 1.2M BRL
    marketCap: 229_000, // ~$229K USD
    volume24h: 42_000,
    price: 0.19,
    priceChange24h: -0.02,
    chains: ["Celo"],
    change7d: -3.21,
    color: "#35D07F",
  },
  {
    symbol: "BRLV",
    name: "BRLV",
    supply: 950_000,
    marketCap: 180_000,
    volume24h: 18_000,
    price: 0.19,
    priceChange24h: 0.0,
    chains: ["Polygon", "Ethereum"],
    change7d: 0.62,
    color: "#EC4899",
  },
];

function generateSupplyHistory(days: number): SupplyDataPoint[] {
  const data: SupplyDataPoint[] = [];
  const now = new Date();
  let baseBrz = 1_200_000_000;
  let baseBrla = 5_500_000;
  let baseBrl1 = 1_800_000;
  let baseBbrl = 1_400_000;
  let baseBrlm = 900_000;
  let baseBrlv = 700_000;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    baseBrz += Math.random() * 6_000_000 - 2_000_000;
    baseBrla += Math.random() * 120_000 - 40_000;
    baseBrl1 += Math.random() * 25_000 - 10_000;
    baseBbrl += Math.random() * 18_000 - 8_000;
    baseBrlm += Math.random() * 12_000 - 5_000;
    baseBrlv += Math.random() * 10_000 - 4_000;

    data.push({
      date: date.toISOString().split("T")[0],
      brz: Math.round(baseBrz),
      brla: Math.round(baseBrla),
      brl1: Math.round(baseBrl1),
      bbrl: Math.round(baseBbrl),
      brlm: Math.round(baseBrlm),
      brlv: Math.round(baseBrlv),
      total: Math.round(
        baseBrz + baseBrla + baseBrl1 + baseBbrl + baseBrlm + baseBrlv
      ),
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

// Chain breakdown from DeFiLlama real data (BRZ dominates)
export const mockChainData: ChainData[] = [
  { chain: "Gnosis", supply: 1_085_400_000, color: "#04795B" },
  { chain: "Solana", supply: 200_000_000, color: "#00D4AA" },
  { chain: "Polygon", supply: 49_800_000, color: "#8247E5" },
  { chain: "Ethereum", supply: 14_000_000, color: "#627EEA" },
  { chain: "Base", supply: 10_200_000, color: "#0052FF" },
  { chain: "BNB Chain", supply: 10_000_000, color: "#F3BA2F" },
  { chain: "Celo", supply: 2_600_000, color: "#35D07F" },
  { chain: "Avalanche", supply: 923_000, color: "#E84142" },
];

function generateMintBurn(days: number): MintBurnDataPoint[] {
  const data: MintBurnDataPoint[] = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split("T")[0],
      mint: Math.round(Math.random() * 4_000_000 + 500_000),
      burn: Math.round(Math.random() * 3_000_000 + 300_000),
    });
  }
  return data;
}

export const mockMintBurnHistory = generateMintBurn(30);

// Pools from Iporanga Top 10 (real TVL values)
export const mockPools: Pool[] = [
  {
    protocol: "Uniswap V3",
    chain: "Polygon",
    pair: "BRLA/USDC",
    tvl: 199_230,
    volume24h: 151_400,
    apy: 14.1,
  },
  {
    protocol: "Uniswap V3",
    chain: "Celo",
    pair: "cREAL/USDT",
    tvl: 157_060,
    volume24h: 32_760,
    apy: 9.8,
  },
  {
    protocol: "Balancer",
    chain: "Polygon",
    pair: "USDC/BRL1",
    tvl: 89_960,
    volume24h: 540,
    apy: 3.2,
  },
  {
    protocol: "Uniswap V3",
    chain: "Base",
    pair: "BRZ/USDC",
    tvl: 65_240,
    volume24h: 37,
    apy: 1.8,
  },
  {
    protocol: "Balancer",
    chain: "Polygon",
    pair: "USDC/BRLA",
    tvl: 62_720,
    volume24h: 22_497,
    apy: 12.5,
  },
  {
    protocol: "Ubeswap",
    chain: "Celo",
    pair: "cREAL/cEUR",
    tvl: 42_950,
    volume24h: 4_851,
    apy: 8.4,
  },
  {
    protocol: "Uniswap V3",
    chain: "Polygon",
    pair: "USDT/BRZ",
    tvl: 23_660,
    volume24h: 14_667,
    apy: 18.2,
  },
  {
    protocol: "Ubeswap",
    chain: "Celo",
    pair: "cREAL/cKES",
    tvl: 23_100,
    volume24h: 1_701,
    apy: 6.1,
  },
  {
    protocol: "Balancer",
    chain: "Polygon",
    pair: "BRL1/USDT",
    tvl: 8_760,
    volume24h: 58,
    apy: 2.4,
  },
  {
    protocol: "Orca",
    chain: "Solana",
    pair: "BRZ/USDC",
    tvl: 6_800,
    volume24h: 2_400,
    apy: 15.3,
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

  const chainColors: Record<string, string> = {
    Ethereum: "#627EEA",
    Polygon: "#8247E5",
    Solana: "#00D4AA",
    "BNB Chain": "#F3BA2F",
    Base: "#0052FF",
    Gnosis: "#04795B",
    Avalanche: "#E84142",
    Celo: "#35D07F",
    "OP Mainnet": "#FF0420",
    Arbitrum: "#28A0F0",
    Tron: "#FF060A",
    Moonbeam: "#53CBC9",
    Mantle: "#000000",
    Rootstock: "#FF9931",
  };

  const websites: Record<string, string> = {
    BRZ: "https://brz.digital",
    BRLA: "https://brla.digital",
    BRL1: "https://num.finance",
    BRLm: "https://mento.org",
    BBRL: "#",
    BRLV: "#",
  };

  return {
    symbol: coin.symbol,
    name: coin.name,
    supply: coin.supply,
    marketCap: coin.marketCap,
    price: coin.price,
    priceChange24h: coin.priceChange24h,
    volume24h: coin.volume24h,
    holders: Math.round(Math.random() * 20_000 + 5_000),
    chains: coin.chains,
    description: `${coin.name} (${coin.symbol}) is a BRL-pegged stablecoin operating across ${coin.chains.length} blockchain(s).`,
    website: websites[coin.symbol] || "#",
    supplyHistory,
    chainBreakdown: coin.chains.map((chain) => ({
      chain,
      supply: Math.round(
        coin.supply / coin.chains.length +
          Math.random() * coin.supply * 0.1
      ),
      color: chainColors[chain] || "#9CA3AF",
    })),
    mintBurnHistory: generateMintBurn(30),
    pools: mockPools.filter((p) =>
      p.pair.toLowerCase().includes(coin.symbol.toLowerCase())
    ),
  };
}
