import { supabaseAdmin } from "@/lib/supabase/admin";
import { getXPMultiplier } from "./getXPMultiplier";
import { getActiveSeason } from "./getActiveSeason";
import { completeQuestStep } from "./completeQuestStep";

type AwardXPParams = {
  userId: string;
  roles: string[];
  baseXP: number;
  source: "system" | "login" | "quest" | "trade" | "admin";
};

export async function awardXP({
  userId,
  roles,
  baseXP,
  source,
}: AwardXPParams) {
  const multiplier = getXPMultiplier(roles) ?? 1;
  const totalXP = Math.floor(baseXP * multiplier);

  // 1️⃣ XP event
  await supabaseAdmin.from("xp_events").insert({
    user_id: userId,
    source,
    base_xp: baseXP,
    multiplier,
    total_xp: totalXP,
  });

  // 2️⃣ Lifetime XP
  const { data: existing } = await supabaseAdmin
    .from("user_xp")
    .select("total_xp, level")
    .eq("user_id", userId)
    .maybeSingle();

  const oldXP = existing?.total_xp ?? 0;
  const newXP = oldXP + totalXP;

  const oldLevel = existing?.level ?? 1;
  const newLevel = Math.floor(newXP / 100) + 1;

  await supabaseAdmin.from("user_xp").upsert({
    user_id: userId,
    total_xp: newXP,
    level: newLevel,
    updated_at: new Date().toISOString(),
  });

  // 3️⃣ Seasonal XP
  const season = await getActiveSeason();
  if (season) {
    await supabaseAdmin
      .from("season_user_xp")
      .upsert({
        season_id: season.id,
        user_id: userId,
        xp: totalXP,
      }, { onConflict: "season_id,user_id" });
  }

  // 4️⃣ Auto quest hook
  if (newXP >= 100) {
    await completeQuestStep({
      userId,
      stepCode: "EARN_100_XP",
      roles,
    });
  }

  return {
    totalXP: newXP,
    level: newLevel,
  };
}
