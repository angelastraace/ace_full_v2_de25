import { supabase } from "@/lib/supabase";

export async function resolveAvatar(userId: string) {
  const { data } = await supabase
    .from("user_avatar")
    .select("ace_kat_avatars(*)")
    .eq("user_id", userId)
    .single();

  return data?.ace_kat_avatars ?? null;
}
