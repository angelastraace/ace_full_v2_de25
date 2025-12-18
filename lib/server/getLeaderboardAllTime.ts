import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getLeaderboardAllTime(limit = 50) {
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
    .order("total_xp", { ascending: false })
    .limit(limit);

  return (
    data?.map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      username: row.profiles?.username ?? "Unknown",
      avatar: row.profiles?.avatar_url ?? null,
      level: row.level,
      xp: row.total_xp,
    })) ?? []
  );
}
