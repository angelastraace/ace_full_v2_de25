import { supabaseAdmin } from "@/lib/supabase/admin";

type Params = {
  userId: string;
  level: number;
  totalXP: number;
};

export async function awardBadges({
  userId,
  level,
  totalXP,
}: Params): Promise<string[]> {
  const unlocked: string[] = [];

  const rules = [
    { code: "FIRST_XP", when: totalXP >= 1 },
    { code: "LEVEL_5", when: level >= 5 },
    { code: "LEVEL_10", when: level >= 10 },
    { code: "STREAK_7", when: false }, // placeholder
  ];

  for (const rule of rules) {
    if (!rule.when) continue;

    const { data: exists } = await supabaseAdmin
      .from("user_badges")
      .select("badge")
      .eq("user_id", userId)
      .eq("badge", rule.code)
      .maybeSingle();

    if (!exists) {
      await supabaseAdmin.from("user_badges").insert({
        user_id: userId,
        badge: rule.code,
        unlocked_at: new Date().toISOString(),
      });

      unlocked.push(rule.code);
    }
  }

  return unlocked;
}
