"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { playSound } from "@/lib/sound/playSound";

type Props = {
  badgeName: string;
  onDone: () => void;
};

export function LegendaryUnlockOverlay({ badgeName, onDone }: Props) {
  useEffect(() => {
    // Legendary sound
    playSound("/sounds/badge-legendary.mp3", 0.8);

    // Big confetti burst
    confetti({
      particleCount: 260,
      spread: 120,
      startVelocity: 55,
      origin: { y: 0.45 },
      colors: ["#FFD700", "#FBBF24", "#A855F7"],
    });

    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
      <div className="relative">
        {/* Halo */}
        <div className="absolute -inset-16 rounded-full blur-3xl bg-gradient-to-r from-yellow-400/40 via-purple-500/30 to-yellow-400/40 animate-pulse" />
        {/* Card */}
        <div className="relative rounded-2xl border border-yellow-400/60 bg-black/70 px-10 py-8 text-center shadow-[0_0_80px_20px_rgba(250,204,21,0.35)]">
          <div className="text-5xl mb-3">🏆</div>
          <div className="text-sm tracking-widest text-yellow-300/80">
            LEGENDARY UNLOCKED
          </div>
          <div className="mt-2 text-2xl font-extrabold text-yellow-300">
            {badgeName}
          </div>
        </div>
      </div>
    </div>
  );
}
