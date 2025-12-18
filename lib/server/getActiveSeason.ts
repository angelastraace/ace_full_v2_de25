import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getActiveSeason() {
  const { data, error } = await supabaseAdmin
    .from("leaderboard_seasons")
    .select("*")
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("No active season", error.message);
    return null;
  }

  return data;
}
