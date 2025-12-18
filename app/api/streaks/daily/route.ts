import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getUserWithRoles } from "@/lib/auth/getUserWithRoles";
import { awardXP } from "@/lib/xp/awardXP";
import { calcStreakBonus } from "@/lib/streaks/calcStreakBonus";

function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function POST() {
  const auth = await getUserWithRoles();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookies().get(n)?.value } }
  );

  // Load streak
  const { data: streakRow } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const last = streakRow?.last_claim_date;
  const isToday = last === today();
  const continues = last === yesterday();

  if (isToday) {
    return NextResponse.json({
      streak: streakRow.streak_count,
      alreadyClaimed: true,
    });
  }

  const newStreak = continues ? streakRow!.streak_count + 1 : 1;
  const bonusXP = calcStreakBonus(newStreak);

  // Persist streak
  await supabase.from("user_streaks").upsert({
    user_id: auth.user.id,
    streak_count: newStreak,
    last_claim_date: today(),
    updated_at: new Date().toISOString(),
  });

  // Award XP
  await awardXP({
    userId: auth.user.id,
    roles: auth.roles,
    baseXP: bonusXP,
    source: "daily_streak",
  });

  return NextResponse.json({
    streak: newStreak,
    bonusXP,
  });
}
