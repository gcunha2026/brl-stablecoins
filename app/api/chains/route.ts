import { NextResponse } from "next/server";
import { fetchAllStablecoins } from "@/lib/blockchain";

export const revalidate = 300;

export async function GET() {
  const coins = await fetchAllStablecoins();

  // Aggregate supply by chain across all coins
  const chainMap: Record<string, number> = {};
  for (const coin of coins) {
    for (const ch of coin.chains) {
      chainMap[ch.chain] = (chainMap[ch.chain] ?? 0) + ch.supply;
    }
  }

  const totalSupply = Object.values(chainMap).reduce((s, v) => s + v, 0);
  const chains = Object.entries(chainMap)
    .map(([chain, supply]) => ({
      chain,
      supply,
      supply_usd: supply * (coins[0]?.priceUsd ?? 0.19),
      percentage: totalSupply > 0 ? (supply / totalSupply) * 100 : 0,
    }))
    .sort((a, b) => b.supply - a.supply);

  return NextResponse.json({ total_supply_usd: totalSupply * 0.19, chains });
}
