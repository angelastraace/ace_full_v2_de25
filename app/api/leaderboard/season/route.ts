// app/api/leaderboard/season/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getActiveSeason } from "@/lib/season/getActiveSeason";

export async function GET() {
  const season = await getActiveSeason();

  if (!season) {
    return NextResponse.json({
      season: null,
      leaderboard: [],
    });
  }

  const { data, error } = await supabase
    .from("player_seasons")
    .select("user_id, season_xp, season_rank, season_level")
    .eq("season_id", season.id)
    .order("season_rank", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    season: {
      id: season.id,
      name: season.name,
    },
    leaderboard: data ?? [],
  });
}
