"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { playSound } from "@/lib/sound/playSound";

type Props = {
  title: string;
  onDone: () => void;
};

export function ChainCompleteOverlay({ title, onDone }: Props) {
  useEffect(() => {
    playSound("/sounds/quest-complete.mp3", 0.7);

    confetti({
      particleCount: 220,
      spread: 100,
      origin: { y: 0.45 },
      colors: ["#22d3ee", "#a855f7", "#34d399"],
    });

    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
      <div className="rounded-2xl border border-cyan-400/40 bg-black/70 px-10 py-8 text-center shadow-[0_0_80px_20px_rgba(34,211,238,0.35)]">
        <div className="text-sm tracking-widest text-cyan-300/80">
          QUEST CHAIN COMPLETE
        </div>
        <div className="mt-2 text-2xl font-extrabold text-cyan-300">
          {title}
        </div>
      </div>
    </div>
  );
}
