import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { TIER_RULES } from "@/lib/tier/tierRules";

export async function POST() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: state } = await supabase
    .from("player_state_cache")
    .select("tier, level")
    .eq("user_id", user.id)
    .single();

  const targetTier = state.tier;

  if (!TIER_RULES[targetTier].requiresClaim) {
    return NextResponse.json({ error: "No claim required" }, { status: 400 });
  }

  await supabase.from("tier_claims").upsert({
    user_id: user.id,
    tier: targetTier,
  });

  return NextResponse.json({ success: true, tier: targetTier });
}
