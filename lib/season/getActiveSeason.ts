// lib/season/getActiveSeason.ts
import { createServerClient } from "@/lib/supabase/server";

export async function getActiveSeason() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .eq("is_active", true)
    .single();

  if (error) return null;

  return data;
}
