"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

import { playSound } from "@/lib/sound/playSound";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  level: number;
  previousLevel: number;
};

export function LevelUpCelebration({
  level,
  previousLevel,
}: Props) {
  const open = level > previousLevel;

  // 🎉 Confetti + sound (fires once per level-up)
  useEffect(() => {
    if (!open) return;

    // Sound
    playSound("/sounds/level-up.mp3", 0.6);

    // Confetti
    confetti({
      particleCount: 180,
      spread: 80,
      origin: { y: 0.6 },
    });
  }, [open]);

  return (
    <Dialog open={open}>
      <DialogContent className="text-center max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Level Up 🎉
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-5xl font-extrabold text-primary">
            Level {level}
          </div>

          <p className="text-muted-foreground">
            New power unlocked. Keep climbing.
          </p>

          <Button
            onClick={() => {}}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
