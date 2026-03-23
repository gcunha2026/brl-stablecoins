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
  totalMarketCap: 46_200_000,
  marketCapChange24h: 1.87,
  totalSupply: 261_500_000,
  supplyChange24h: 0.94,
  totalHolders: 58_400,
  holdersChange24h: 0.52,
  volume24h: 12_800_000,
  volumeChange24h: -2.15,
};

export const mockStablecoins: Stablecoin[] = [
  {
    symbol: "BRZ",
    name: "BRZ (Transfero)",
    supply: 260_700_000,
    marketCap: 44_900_000,
    volume24h: 11_200_000,
    price: 0.172,
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
    supply: 580_000,
    marketCap: 100_000,
    volume24h: 820_000,
    price: 0.172,
    priceChange24h: -0.01,
    chains: ["Ethereum", "Polygon"],
    change7d: 8.45,
    color: "#7C3AED",
  },
  {
    symbol: "cBRL",
    name: "Mento Brazilian Real",
    supply: 215_000,
    marketCap: 37_000,
    volume24h: 42_000,
    price: 0.172,
    priceChange24h: -0.02,
    chains: ["Celo"],
    change7d: -3.21,
    color: "#35D07F",
  },
  {
    symbol: "BRTH",
    name: "BRTH",
    supply: 0,
    marketCap: 0,
    volume24h: 0,
    price: 0,
    priceChange24h: 0,
    chains: ["Polygon"],
    change7d: 0,
    color: "#EC4899",
  },
];

function generateSupplyHistory(days: number): SupplyDataPoint[] {
  const data: SupplyDataPoint[] = [];
  const now = new Date();
  let baseBrz = 230_000_000;
  let baseBrla = 320_000;
  let baseCbrl = 180_000;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    baseBrz += Math.random() * 1_500_000 - 600_000;
    baseBrla += Math.random() * 30_000 - 10_000;
    baseCbrl += Math.random() * 8_000 - 4_000;

    data.push({
      date: date.toISOString().split("T")[0],
      brz: Math.round(baseBrz),
      brla: Math.round(baseBrla),
      cbrl: Math.round(baseCbrl),
      total: Math.round(baseBrz + baseBrla + baseCbrl),
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
  { chain: "Polygon", supply: 98_000_000, color: "#8247E5" },
  { chain: "Ethereum", supply: 62_000_000, color: "#627EEA" },
  { chain: "Solana", supply: 38_000_000, color: "#00D4AA" },
  { chain: "BNB Chain", supply: 22_000_000, color: "#F3BA2F" },
  { chain: "Base", supply: 15_000_000, color: "#0052FF" },
  { chain: "Gnosis", supply: 10_000_000, color: "#04795B" },
  { chain: "Avalanche", supply: 6_500_000, color: "#E84142" },
  { chain: "Celo", supply: 4_200_000, color: "#35D07F" },
  { chain: "Arbitrum", supply: 3_000_000, color: "#28A0F0" },
  { chain: "Tron", supply: 2_000_000, color: "#FF060A" },
];

function generateMintBurn(days: number): MintBurnDataPoint[] {
  const data: MintBurnDataPoint[] = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split("T")[0],
      mint: Math.round(Math.random() * 3_000_000 + 500_000),
      burn: Math.round(Math.random() * 2_000_000 + 300_000),
    });
  }
  return data;
}

export const mockMintBurnHistory = generateMintBurn(30);

export const mockPools: Pool[] = [
  {
    protocol: "Uniswap V3",
    chain: "Polygon",
    pair: "BRZ/USDC",
    tvl: 4_500_000,
    volume24h: 1_800_000,
    apy: 12.4,
  },
  {
    protocol: "Curve",
    chain: "Ethereum",
    pair: "BRZ/USDT",
    tvl: 3_200_000,
    volume24h: 980_000,
    apy: 8.7,
  },
  {
    protocol: "Uniswap V3",
    chain: "Ethereum",
    pair: "BRZ/USDC",
    tvl: 2_800_000,
    volume24h: 720_000,
    apy: 10.2,
  },
  {
    protocol: "Orca",
    chain: "Solana",
    pair: "BRZ/USDC",
    tvl: 1_900_000,
    volume24h: 640_000,
    apy: 18.6,
  },
  {
    protocol: "PancakeSwap",
    chain: "BNB Chain",
    pair: "BRZ/BUSD",
    tvl: 1_200_000,
    volume24h: 380_000,
    apy: 11.3,
  },
  {
    protocol: "Ubeswap",
    chain: "Celo",
    pair: "cBRL/cUSD",
    tvl: 420_000,
    volume24h: 85_000,
    apy: 9.8,
  },
  {
    protocol: "Uniswap V3",
    chain: "Polygon",
    pair: "BRLA/USDC",
    tvl: 380_000,
    volume24h: 120_000,
    apy: 14.1,
  },
  {
    protocol: "Raydium",
    chain: "Solana",
    pair: "BRZ/SOL",
    tvl: 340_000,
    volume24h: 190_000,
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
    website:
      coin.symbol === "BRZ"
        ? "https://brz.digital"
        : coin.symbol === "BRLA"
          ? "https://brla.digital"
          : coin.symbol === "cBRL"
            ? "https://mento.org"
            : "#",
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
