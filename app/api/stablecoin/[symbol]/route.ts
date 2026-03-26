import { NextRequest, NextResponse } from "next/server";
import { fetchAllStablecoins } from "@/lib/blockchain";

export const revalidate = 300;

export async function GET(
  _req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const { symbol } = params;
  const coins = await fetchAllStablecoins();
  const coin = coins.find(
    (c) => c.symbol.toUpperCase() === symbol.toUpperCase()
  );
  if (!coin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...coin,
    total_supply: coin.totalSupply,
    market_cap_usd: coin.marketCapUsd,
    price_usd: coin.priceUsd,
    volume_24h_usd: coin.volume24hUsd,
    holders: 0,
    supply_history: [],
    pools: [],
  });
}
