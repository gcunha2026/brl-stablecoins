export interface OverviewData {
  totalMarketCap: number;
  marketCapChange24h: number;
  totalSupply: number;
  supplyChange24h: number;
  totalHolders: number;
  holdersChange24h: number;
  volume24h: number;
  volumeChange24h: number;
}

export interface Stablecoin {
  symbol: string;
  name: string;
  supply: number;
  marketCap: number;
  volume24h: number;
  price: number;
  priceChange24h: number;
  chains: string[];
  change7d: number;
  color: string;
}

export interface SupplyDataPoint {
  date: string;
  total: number;
  brz: number;
  brlc: number;
  drex: number;
  creal: number;
  brlx: number;
}

export interface ChainData {
  chain: string;
  supply: number;
  color: string;
}

export interface MintBurnDataPoint {
  date: string;
  mint: number;
  burn: number;
}

export interface Pool {
  protocol: string;
  chain: string;
  pair: string;
  tvl: number;
  volume24h: number;
  apy: number;
}

export interface StablecoinDetail {
  symbol: string;
  name: string;
  supply: number;
  marketCap: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  holders: number;
  chains: string[];
  description: string;
  website: string;
  supplyHistory: { date: string; value: number }[];
  chainBreakdown: ChainData[];
  mintBurnHistory: MintBurnDataPoint[];
  pools: Pool[];
}

export type Period = "7d" | "30d" | "90d" | "1y" | "all";
