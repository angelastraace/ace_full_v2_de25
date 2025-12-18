"use client";

import { useEffect, useState } from "react";

import { XPProgressBar } from "@/components/xp/XPProgressBar";
import { DailyStreakWidget } from "@/components/streaks/DailyStreakWidget";
import { LevelUpCelebration } from "@/components/xp/LevelUpCelebration";
import { BadgeUnlockToast } from "@/components/badges/BadgeUnlockToast";
import { LegendaryUnlockOverlay } from "@/components/badges/LegendaryUnlockOverlay";

import { usePrevious } from "@/hooks/usePrevious";
import { badgeMeta } from "@/components/badges/badgeMeta";

/* ─────────────── TYPES ─────────────── */

type Skin = {
  animated: boolean;
  metadata: {
    gradient: string[];
  };
};

type Props = {
  level: number;
  totalXP: number;
  skin?: Skin;
};

/* ───────────── COMPONENT ───────────── */

export function DashboardClient({ level, totalXP, skin }: Props) {
  const previousLevel = usePrevious(level) ?? level;

  const [unlockedBadge, setUnlockedBadge] = useState<string | null>(null);
  const [legendaryName, setLegendaryName] = useState<string | null>(null);

  // 🔔 Check for newly unlocked badges (NO XP added)
  useEffect(() => {
    fetch("/api/xp/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseXP: 0, source: "system" }),
    })
      .then((r) => r.json())
      .then((res) => {
        const code = res?.unlockedBadges?.[0];
        if (!code) return;

        setUnlockedBadge(code);

        const meta = badgeMeta[code];
        if (meta?.rarity === "Legendary") {
          setLegendaryName(meta.name);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {/* 🟣 Legendary overlay */}
      {legendaryName && (
        <LegendaryUnlockOverlay
          badgeName={legendaryName}
          onDone={() => setLegendaryName(null)}
        />
      )}

      {/* 🎉 Level-up celebration */}
      <LevelUpCelebration
        level={level}
        previousLevel={previousLevel}
      />

      {/* 🎨 Optional cosmetic wrapper */}
      <div
        className={`relative z-20 p-8 text-white max-w-3xl ${
          skin?.animated ? "ace-animated" : ""
        }`}
        style={
          skin
            ? {
                background: `linear-gradient(90deg, ${skin.metadata.gradient.join(",")})`,
              }
            : undefined
        }
      >
        <h1 className="text-3xl font-bold mb-4">
          Dashboard
        </h1>

        <div className="mb-6">
          <DailyStreakWidget />
        </div>

        <XPProgressBar
          level={level}
          totalXP={totalXP}
        />
      </div>

      {/* 🔔 Badge toast */}
      {unlockedBadge && (
        <BadgeUnlockToast badgeCode={unlockedBadge} />
      )}
    </>
  );
}
