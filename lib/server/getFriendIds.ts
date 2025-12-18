import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getFriendIds(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_friends")
    .select("user_id, friend_id")
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

  const ids = new Set<string>();
  ids.add(userId); // always include self

  data?.forEach((r) => {
    if (r.user_id !== userId) ids.add(r.user_id);
    if (r.friend_id !== userId) ids.add(r.friend_id);
  });

  return Array.from(ids);
}
