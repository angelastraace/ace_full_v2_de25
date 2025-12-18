import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getLeaderboardWeekly(limit = 50) {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data } = await supabaseAdmin
    .from("xp_events")
    .select(`
      user_id,
      total_xp,
      profiles (
        username,
        avatar_url
      )
    `)
    .gte("created_at", since.toISOString());

  const totals = new Map<string, number>();
  const users = new Map<string, any>();

  data?.forEach((row) => {
    totals.set(
      row.user_id,
      (totals.get(row.user_id) ?? 0) + row.total_xp
    );
    users.set(row.user_id, row.profiles);
  });

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([userId, xp], index) => ({
      rank: index + 1,
      userId,
      xp,
      username: users.get(userId)?.username ?? "Unknown",
      avatar: users.get(userId)?.avatar_url ?? null,
    }));
}
