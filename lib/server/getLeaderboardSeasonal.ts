import { supabaseAdmin } from "@/lib/supabase/admin";
import { getActiveSeason } from "./getActiveSeason";

export async function getLeaderboardSeasonal(limit = 50) {
  const season = await getActiveSeason();
  if (!season) return [];

  const { data } = await supabaseAdmin
    .from("season_user_xp")
    .select(`
      user_id,
      xp,
      profiles (
        username,
        avatar_url
      )
    `)
    .eq("season_id", season.id)
    .order("xp", { ascending: false })
    .limit(limit);

  return (
    data?.map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      username: row.profiles?.username ?? "Unknown",
      avatar: row.profiles?.avatar_url ?? null,
      xp: row.xp,
    })) ?? [];
}
