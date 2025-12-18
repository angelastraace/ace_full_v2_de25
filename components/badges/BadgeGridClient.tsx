"use client";

import { cn } from "@/app/lib/utils";

type Badge = {
  code: string;
  name: string;
  icon: string | null;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
};

type Props = {
  badges?: Badge[];
  earnedCodes?: Set<string>;
  recentlyUnlockedCode?: string | null;
};

const rarityGlow = {
  Common: "border-emerald-400 shadow-emerald-400/30",
  Rare: "border-blue-400 shadow-blue-400/40",
  Epic: "border-purple-500 shadow-purple-500/50",
  Legendary: "border-yellow-400 shadow-yellow-400/60",
};

export function BadgeGridClient({
  badges = [],
  earnedCodes = new Set(),
  recentlyUnlockedCode = null,
}: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {badges.map((badge) => {
        const earned = earnedCodes.has(badge.code);
        const isNew = badge.code === recentlyUnlockedCode;

        return (
          <div
            key={badge.code}
            className={cn(
              "rounded-lg border p-4 text-center transition-all",
              earned
                ? "bg-white/5 text-white"
                : "opacity-40 border-white/10",
              isNew && earned && "glow-pulse",
              isNew && earned && rarityGlow[badge.rarity]
            )}
          >
            <div className="text-2xl mb-2">{badge.icon}</div>
            <div className="font-semibold">{badge.name}</div>
            <div className="text-xs opacity-70">
              {earned ? "Unlocked" : "Locked"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
