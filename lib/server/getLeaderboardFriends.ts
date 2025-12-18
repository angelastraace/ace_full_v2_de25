import { supabaseAdmin } from "@/lib/supabase/admin";
import { getFriendIds } from "./getFriendIds";

export async function getLeaderboardFriends(
  userId: string,
  limit = 50
) {
  const ids = await getFriendIds(userId);

  if (!ids.length) return [];

  const { data } = await supabaseAdmin
    .from("user_xp")
    .select(`
      user_id,
      total_xp,
      level,
      profiles (
        username,
        avatar_url
      )
    `)
    .in("user_id", ids)
    .order("total_xp", { ascending: false })
    .limit(limit);

  return (
    data?.map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      username: row.profiles?.username ?? "Unknown",
      avatar: row.profiles?.avatar_url ?? null,
      xp: row.total_xp,
      level: row.level,
    })) ?? [];
}
