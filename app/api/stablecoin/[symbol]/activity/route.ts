import { NextRequest, NextResponse } from "next/server";
import { getTokenActivity } from "@/lib/activity";

export const revalidate = 600; // 10 min ISR
export const maxDuration = 60; // 60s timeout

const VALID_SYMBOL = /^[A-Za-z0-9]{1,10}$/;

export async function GET(
  _req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const { symbol } = params;
  if (!VALID_SYMBOL.test(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 400 });
  }
  const data = await getTokenActivity(symbol);
  return NextResponse.json(data);
}
