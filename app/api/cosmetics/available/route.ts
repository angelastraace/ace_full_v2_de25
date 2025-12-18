import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { tierGte } from "@/lib/tier/tierRank";

export async function GET() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ skins: [] });

  const { data: state } = await supabase
    .from("player_state_cache")
    .select("tier")
    .eq("user_id", user.id)
    .single();

  const userTier = state?.tier ?? "Bronze";

  const { data: skins } = await supabase
    .from("cosmetic_skins")
    .select("*");

  const unlocked = (skins ?? []).filter(s =>
    tierGte(userTier, s.min_tier)
  );

  return NextResponse.json({ skins: unlocked });
}
