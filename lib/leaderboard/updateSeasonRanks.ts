// lib/leaderboard/updateSeasonRanks.ts
import { createServerClient } from "@/lib/supabase";

export async function updateSeasonRanks(seasonId: string) {
  const supabase = createServerClient();

  const { data: rows } = await supabase
    .from("player_seasons")
    .select("user_id, season_xp")
    .eq("season_id", seasonId)
    .order("season_xp", { ascending: false });

  if (!rows) return;

  for (let i = 0; i < rows.length; i++) {
    await supabase
      .from("player_seasons")
      .update({ season_rank: i + 1 })
      .eq("user_id", rows[i].user_id)
      .eq("season_id", seasonId);
  }
}
