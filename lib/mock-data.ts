import {
  OverviewData,
  Stablecoin,
  SupplyDataPoint,
  ChainData,
  MintBurnDataPoint,
  Pool,
  StablecoinDetail,
} from "./types";

// Values aligned with Iporanga dashboard (Mar 2026)
// Total Supply: ~$90M USD | Weekly Volume: ~$107M | Holders: ~106K
export const mockOverview: OverviewData = {
  totalMarketCap: 90_330_000,
  marketCapChange24h: 1.42,
  totalSupply: 524_000_000, // ~524M BRL ≈ $90M USD
  supplyChange24h: 0.78,
  totalHolders: 106_200,
  holdersChange24h: 0.52,
  volume24h: 15_320_000, // weekly ~$107M → daily ~$15M
  volumeChange24h: -1.85,
};

// 6 BRL stablecoins from Iporanga + DeFiLlama
// Supply in BRL units, marketCap/volume in USD
export const mockStablecoins: Stablecoin[] = [
  {
    symbol: "BRZ",
    name: "BRZ (Transfero)",
    supply: 260_700_000, // DeFiLlama: 260.7M BRL
    marketCap: 44_900_000, // ~$44.9M USD
    volume24h: 8_400_000,
    price: 0.172, // ~1 BRL in USD
    priceChange24h: 0.03,
    chains: [
      "Ethereum",
      "Polygon",
      "Solana",
      "BNB Chain",
      "Base",
      "Gnosis",
      "Avalanche",
      "Celo",
      "OP Mainnet",
      "Arbitrum",
      "Tron",
      "Moonbeam",
      "Mantle",
      "Rootstock",
    ],
    change7d: 2.18,
    color: "#00D4AA",
  },
  {
    symbol: "BRLA",
    name: "BRLA Digital",
    supply: 142_000_000, // significant player per Iporanga
    marketCap: 24_500_000,
    volume24h: 4_200_000,
    price: 0.172,
    priceChange24h: -0.01,
    chains: ["Ethereum", "Polygon"],
    change7d: 5.32,
    color: "#7C3AED",
  },
  {
    symbol: "BRL1",
    name: "BRL1 (Num Finance)",
    supply: 68_000_000,
    marketCap: 11_700_000,
    volume24h: 1_100_000,
    price: 0.172,
    priceChange24h: 0.01,
    chains: ["Polygon"],
    change7d: 1.45,
    color: "#00B4D8",
  },
  {
    symbol: "BBRL",
    name: "BBRL",
    supply: 32_000_000,
    marketCap: 5_500_000,
    volume24h: 620_000,
    price: 0.172,
    priceChange24h: -0.02,
    chains: ["Ethereum", "Polygon"],
    change7d: -0.87,
    color: "#F59E0B",
  },
  {
    symbol: "BRLm",
    name: "Mento Brazilian Real",
    supply: 215_000, // DeFiLlama: ~215K BRL
    marketCap: 37_000,
    volume24h: 42_000,
    price: 0.172,
    priceChange24h: -0.02,
    chains: ["Celo"],
    change7d: -3.21,
    color: "#35D07F",
  },
  {
    symbol: "BRLV",
    name: "BRLV",
    supply: 18_500_000,
    marketCap: 3_190_000,
    volume24h: 280_000,
    price: 0.172,
    priceChange24h: 0.0,
    chains: ["Polygon", "Ethereum"],
    change7d: 0.62,
    color: "#EC4899",
  },
];

function generateSupplyHistory(days: number): SupplyDataPoint[] {
  const data: SupplyDataPoint[] = [];
  const now = new Date();
  let baseBrz = 230_000_000;
  let baseBrla = 105_000_000;
  let baseBrl1 = 48_000_000;
  let baseBbrl = 25_000_000;
  let baseBrlm = 180_000;
  let baseBrlv = 14_000_000;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    baseBrz += Math.random() * 1_200_000 - 400_000;
    baseBrla += Math.random() * 1_500_000 - 500_000;
    baseBrl1 += Math.random() * 800_000 - 300_000;
    baseBbrl += Math.random() * 300_000 - 120_000;
    baseBrlm += Math.random() * 2_000 - 1_000;
    baseBrlv += Math.random() * 200_000 - 80_000;

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

// Chain breakdown (aligned with Iporanga: 8 blockchains)
export const mockChainData: ChainData[] = [
  { chain: "Polygon", supply: 185_000_000, color: "#8247E5" },
  { chain: "Ethereum", supply: 142_000_000, color: "#627EEA" },
  { chain: "Solana", supply: 78_000_000, color: "#00D4AA" },
  { chain: "BNB Chain", supply: 42_000_000, color: "#F3BA2F" },
  { chain: "Base", supply: 28_000_000, color: "#0052FF" },
  { chain: "Gnosis", supply: 18_000_000, color: "#04795B" },
  { chain: "Avalanche", supply: 16_000_000, color: "#E84142" },
  { chain: "Celo", supply: 15_200_000, color: "#35D07F" },
];

function generateMintBurn(days: number): MintBurnDataPoint[] {
  const data: MintBurnDataPoint[] = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split("T")[0],
      mint: Math.round(Math.random() * 1_500_000 + 200_000),
      burn: Math.round(Math.random() * 1_000_000 + 100_000),
    });
  }
  return data;
}

export const mockMintBurnHistory = generateMintBurn(30);

// Pools aligned with Iporanga's Top 10 Pools by TVL
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
