// app/api/leaderboard/all-time/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createServerClient();

  const { data } = await supabase
    .from("player_state_cache")
    .select("user_id, legacy_xp, rank, tier, level")
    .order("rank", { ascending: true })
    .limit(100);

  return NextResponse.json({ leaderboard: data ?? [] });
}
