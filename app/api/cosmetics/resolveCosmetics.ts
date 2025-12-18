import { supabase } from "@/lib/supabase";

export async function resolveCosmetics(userId: string) {
  const { data: picks } = await supabase
    .from("user_cosmetics")
    .select("category, skin_id, cosmetic_skins(metadata)")
    .eq("user_id", userId);

  const tokens: Record<string, any> = {};
  for (const p of picks ?? []) {
    tokens[p.category] = p.cosmetic_skins?.metadata ?? {};
  }
  return tokens;
}
