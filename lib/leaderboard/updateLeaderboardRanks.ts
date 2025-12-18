// lib/leaderboard/updateLeaderboardRanks.ts
import { createServerClient } from "@/lib/supabase/server";
import { smoothRank } from "./smoothRank";

export async function updateLeaderboardRanks() {
  const supabase = createServerClient();

  const { data: players } = await supabase
    .from("player_state_cache")
    .select("user_id, xp, rank, display_rank")
    .order("xp", { ascending: false });

  if (!players) return;

  for (let i = 0; i < players.length; i++) {
    const trueRank = i + 1;
    const p = players[i];

    const currentDisplay = p.display_rank ?? trueRank;

    const { displayRank, delta } = smoothRank(
      currentDisplay,
      trueRank
    );

    await supabase
      .from("player_state_cache")
      .update({
        rank: trueRank,
        display_rank: displayRank,
        rank_delta: trueRank - displayRank,
      })
      .eq("user_id", p.user_id);
  }
}
