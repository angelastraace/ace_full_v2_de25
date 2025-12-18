"use client";

import { useEffect } from "react";
import { playSound } from "@/lib/sound/playSound";

type Props = {
  badgeCode: string;
  rarity?: "Common" | "Rare" | "Epic" | "Legendary";
};

export function BadgeUnlockToast({
  badgeCode,
  rarity = "Common",
}: Props) {
  useEffect(() => {
    const soundMap = {
      Common: "/sounds/badge-common.mp3",
      Rare: "/sounds/badge-rare.mp3",
      Epic: "/sounds/badge-epic.mp3",
      Legendary: "/sounds/badge-legendary.mp3",
    };

    playSound(soundMap[rarity], 0.7);
  }, [badgeCode, rarity]);

  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-emerald-400 bg-black/80 px-4 py-3 text-white shadow-lg">
      <div className="font-semibold">🏅 Badge Unlocked</div>
      <div className="text-sm opacity-80">{badgeCode}</div>
    </div>
  );
}
