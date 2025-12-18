import { supabaseAdmin } from "@/lib/supabase/admin";
import { getXPMultiplier } from "./getXPMultiplier";

type AwardXPParams = {
  userId: string;
  roles: string[];
  baseXP: number;
  source: "system" | "quest" | "login" | "trade";
};

export async function awardXP({
  userId,
  roles,
  baseXP,
  source,
}: AwardXPParams) {
  const multiplier = getXPMultiplier(roles) ?? 1;
  const totalXP = Math.floor(baseXP * multiplier);

  // 1️⃣ Insert XP event (authoritative log)
  const { error: eventError } = await supabaseAdmin
    .from("xp_events")
    .insert({
      user_id: userId,
      source,
      base_xp: baseXP,
      multiplier,
      total_xp: totalXP,
    });

  if (eventError) {
    console.error("XP event insert failed", eventError);
    throw eventError;
  }

  // 2️⃣ Fetch current aggregate XP
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("user_xp")
    .select("total_xp, level")
    .eq("user_id", userId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw fetchError;
  }

  const oldXP = existing?.total_xp ?? 0;
  const newXP = oldXP + totalXP;

  const oldLevel = existing?.level ?? 1;
  const newLevel = Math.floor(newXP / 100) + 1;

  // 3️⃣ Upsert aggregate XP
  await supabaseAdmin.from("user_xp").upsert({
    user_id: userId,
    total_xp: newXP,
    level: newLevel,
    updated_at: new Date().toISOString(),
  });

  // 4️⃣ Level-up hook
  if (newLevel > oldLevel) {
    await supabaseAdmin.from("level_up_events").insert({
      user_id: userId,
      old_level: oldLevel,
      new_level: newLevel,
      created_at: new Date().toISOString(),
    });

    // 🔜 hooks: badges, unlocks, notifications
  }

  return { totalXP: newXP, level: newLevel };
}
