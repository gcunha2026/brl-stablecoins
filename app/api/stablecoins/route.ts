import { NextResponse } from "next/server";
import { fetchAllStablecoins } from "@/lib/blockchain";

export const revalidate = 300; // 5 min ISR

export async function GET() {
  const coins = await fetchAllStablecoins();
  return NextResponse.json(coins);
}
