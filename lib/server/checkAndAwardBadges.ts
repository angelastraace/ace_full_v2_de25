// lib/server/checkAndAwardBadges.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Ctx = {
  userId: string;
  totalXP: number;
  level: number;
  streak: number;
};

const BADGE_RULES = [
  {
    code: "FIRST_XP",
    condition: (ctx: Ctx) => ctx.totalXP > 0,
  },
  {
    code: "LEVEL_5",
    condition: (ctx: Ctx) => ctx.level >= 5,
  },
  {
    code: "STREAK_7",
    condition: (ctx: Ctx) => ctx.streak >= 7,
  },
];

export async function checkAndAwardBadges(ctx: Ctx) {
  // 1. Get already-earned badges
  const { data: earned } = await supabase
    .from("user_badges")
    .select("badge_id, badges(code)")
    .eq("user_id", ctx.userId);

  const earnedCodes = new Set(
    earned?.map((b: any) => b.badges.code) ?? []
  );

  // 2. Find eligible badge codes
  const eligibleCodes = BADGE_RULES
    .filter(
      (rule) =>
        rule.condition(ctx) && !earnedCodes.has(rule.code)
    )
    .map((rule) => rule.code);

  if (eligibleCodes.length === 0) return [];

  // 3. Resolve badge IDs
  const { data: badges } = await supabase
    .from("badges")
    .select("id, code")
    .in("code", eligibleCodes);

  if (!badges?.length) return [];

  // 4. Insert (idempotent)
  const inserts = badges.map((badge) => ({
    user_id: ctx.userId,
    badge_id: badge.id,
  }));

  await supabase.from("user_badges").insert(inserts);

  return badges.map((b) => b.code);
}
