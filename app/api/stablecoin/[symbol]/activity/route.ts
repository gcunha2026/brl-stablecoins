import { NextRequest, NextResponse } from "next/server";
import { getTokenActivity } from "@/lib/activity";
import { supabase } from "@/lib/supabase";

export const revalidate = 600; // 10 min ISR
export const maxDuration = 60; // 60s timeout (Vercel Pro)

export async function GET(
  _req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const { symbol } = params;

  const data = await getTokenActivity(symbol);
  const res = NextResponse.json(data);
  res.headers.set("x-source", supabase ? "supabase" : "blockscout-fallback");
  res.headers.set("x-days", String(data.daily.length));
  res.headers.set("x-env-url", process.env.SUPABASE_URL ? "yes" : "no");
  res.headers.set("x-env-key", process.env.SUPABASE_SERVICE_KEY ? "yes" : "no");
  return res;
}
