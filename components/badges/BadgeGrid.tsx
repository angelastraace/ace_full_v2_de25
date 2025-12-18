"use client";

import { cn } from "@/app/lib/utils";
import { useEffect, useState } from "react";

type Badge = {
  code: string;
  name: string;
  description: string;
  icon: string | null;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
};

type Props = {
  badges?: Badge[];
  earnedCodes?: Set<string>;
  recentlyUnlockedCode?: string | null;
};

const rarityStyles: Record<Badge["rarity"], string> = {
  Common: "border-white/10",
  Rare: "border-blue-500/40 shadow-blue-500/20",
  Epic: "border-purple-500/40 shadow-purple-500/30",
  Legendary: "border-yellow-500/50 shadow-yellow-500/40",
};

export function BadgeGrid({
  badges = [],
  earnedCodes = new Set<string>(),
  recentlyUnlockedCode = null,
}: Props) {
  const [pulseCode, setPulseCode] = useState<string | null>(null);

  // 🔥 Trigger glow pulse once
  useEffect(() => {
    if (recentlyUnlockedCode) {
      setPulseCode(recentlyUnlockedCode);

      const t = setTimeout(() => {
        setPulseCode(null);
      }, 1800);

      return () => clearTimeout(t);
    }
  }, [recentlyUnlockedCode]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {badges.map((badge) => {
        const earned = earnedCodes.has(badge.code);
        const isPulsing = pulseCode === badge.code;

        return (
          <div
            key={badge.code}
            className={cn(
              "relative rounded-lg border p-4 text-center transition-all",
              rarityStyles[badge.rarity],
              earned
                ? "bg-emerald-400/10 border-emerald-400"
                : "opacity-50 grayscale",
              isPulsing &&
                "animate-pulse ring-4 ring-emerald-400 shadow-[0_0_40px_10px_rgba(52,211,153,0.6)] scale-105"
            )}
          >
            <div className="text-2xl mb-2">
              {badge.icon ?? "🏅"}
            </div>

            <div className="font-semibold">
              {badge.name}
            </div>

            <div className="text-xs opacity-70 mt-1">
              {earned ? "Unlocked" : "Locked"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
