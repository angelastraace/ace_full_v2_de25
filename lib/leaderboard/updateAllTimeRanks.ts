// lib/leaderboard/updateAllTimeRanks.ts
import { createServerClient } from "@/lib/supabase";

export async function updateAllTimeRanks() {
  const supabase = createServerClient();

  const { data: rows } = await supabase
    .from("player_state_cache")
    .select("user_id, legacy_xp")
    .order("legacy_xp", { ascending: false });

  if (!rows) return;

  for (let i = 0; i < rows.length; i++) {
    await supabase
      .from("player_state_cache")
      .update({ rank: i + 1 })
      .eq("user_id", rows[i].user_id);
  }
}
