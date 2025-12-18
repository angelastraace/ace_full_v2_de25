"use client";

import { useEffect, useRef } from "react";
import { playSound } from "@/lib/sound/playSound";

type Props = {
  level: number;
  totalXP: number;
};

export function XPProgressBar({ level, totalXP }: Props) {
  const XP_PER_LEVEL = 100;

  const prevXPRef = useRef<number | null>(null);

  const levelBaseXP = (level - 1) * XP_PER_LEVEL;
  const currentXP = Math.max(0, totalXP - levelBaseXP);
  const progress = Math.min(100, (currentXP / XP_PER_LEVEL) * 100);

  // 🔊 Play XP tick ONLY when XP increases (not on mount)
  useEffect(() => {
    if (prevXPRef.current !== null && totalXP > prevXPRef.current) {
      playSound("/sounds/xp-tick.mp3", 0.25);
    }
    prevXPRef.current = totalXP;
  }, [totalXP]);

  return (
    <div className="mt-4">
      <div className="flex justify-between text-sm text-white/80 mb-1">
        <span>Level {level}</span>
        <span>
          {currentXP} / {XP_PER_LEVEL} XP
        </span>
      </div>

      <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="text-xs text-white/60 mt-1 text-right">
        {Math.round(progress)}% to next level
      </div>
    </div>
  );
}
