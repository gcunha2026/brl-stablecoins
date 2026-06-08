import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Maior valor de `date` em daily_activity. Como o cron escreve uma linha por
// (symbol, chain, address, dia-com-atividade), o maior `date` reflete o dia
// mais recente que o pipeline conseguiu materializar. Tambem retorna o
// timestamp mais recente em token_counters como sinal de "ultima rodada".
export const revalidate = 300;

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ last_activity_date: null, last_run_at: null });
  }

  const { data: activityRow } = await supabase
    .from("daily_activity")
    .select("date")
    .neq("chain", "ALL")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: counterRow } = await supabase
    .from("token_counters")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    last_activity_date: activityRow?.date ?? null,
    last_run_at: counterRow?.updated_at ?? null,
  });
}
