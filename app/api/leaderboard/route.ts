// app/api/leaderboard/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  const { data } = await supabase
    .from("player_state_cache")
    .select(
      "user_id, level, xp, tier, display_rank, rank_delta"
    )
    .order("display_rank", { ascending: true })
    .limit(100);

  return NextResponse.json({ leaderboard: data });
}
