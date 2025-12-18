// lib/fees/getFeeConfig.ts
import { supabase } from "@/lib/supabase";

let cached: any = null;
let cachedAt = 0;

export async function getFeeConfig() {
  if (cached && Date.now() - cachedAt < 60_000) return cached;

  const { data } = await supabase
    .from("fee_config")
    .select("config")
    .eq("id", 1)
    .single();

  cached = data?.config;
  cachedAt = Date.now();
  return cached;
}
