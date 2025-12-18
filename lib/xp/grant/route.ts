// app/api/xp/grant/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getXpWindowStart } from "@/lib/xp/getXpWindow";
import { normalizeXp } from "@/lib/xp/normalizeXp";
import { XP_RULES } from "@/lib/xp/xpRules";

export async function POST(req: Request) {
  const supabase = createServerClient();
  const body = await req.json();

  const { user_id, base_xp, source } = body;

  if (!user_id || !base_xp) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const windowStart = getXpWindowStart(
    new Date(),
    XP_RULES.WINDOW
  );

  const cap = XP_RULES.CAPS[XP_RULES.WINDOW];

  // fetch or init window
  const { data: windowRow } = await supabase
    .from("xp_windows")
    .select("xp_earned")
    .eq("user_id", user_id)
    .eq("window_start", windowStart)
    .single();

  const alreadyEarned = windowRow?.xp_earned ?? 0;

  const { effectiveXp, multiplier } = normalizeXp(
    base_xp,
    alreadyEarned,
    cap
  );

  if (effectiveXp <= 0) {
    return NextResponse.json({
      applied_xp: 0,
      multiplier,
      throttled: true,
    });
  }

  // upsert window
  await supabase.from("xp_windows").upsert({
    user_id,
    window_start: windowStart,
    xp_earned: alreadyEarned + effectiveXp,
  });

  // insert XP event
  await supabase.from("xp_events").insert({
    user_id,
    base_xp,
    effective_xp: effectiveXp,
    source,
    multiplier,
  });

  return NextResponse.json({
    applied_xp: effectiveXp,
    multiplier,
    throttled: multiplier < 1,
  });
}
