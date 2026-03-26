import { NextRequest, NextResponse } from "next/server";
import { getTokenActivity } from "@/lib/activity";

export const revalidate = 600; // 10 min ISR
export const maxDuration = 60; // 60s timeout

export async function GET(
  _req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const { symbol } = params;
  const data = await getTokenActivity(symbol);
  return NextResponse.json(data);
}
