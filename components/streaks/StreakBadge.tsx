"use client";

export function StreakBadge({
  streak,
}: {
  streak: number;
}) {
  return (
    <div className="flex items-center gap-2 bg-orange-500/20 border border-orange-400/40 px-3 py-1 rounded-full text-sm pulse-glow">
      🔥 <span>{streak}-day streak</span>
    </div>
  );
}
