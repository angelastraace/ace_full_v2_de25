"use client";

import { useDailyStreak } from "@/components/streaks/useDailyStreak";
import { StreakBadge } from "@/components/streaks/StreakBadge";

export function DailyStreakWidget() {
  const streakData = useDailyStreak();

  if (!streakData?.streak) return null;

  return (
    <div className="mb-4">
      <StreakBadge streak={streakData.streak} />
    </div>
  );
}
