"use client";

import { cn } from "@/app/lib/utils";

type Quest = {
  id: string;
  code: string;
  title: string;
  description: string;
  xp: number;
  badge: string | null;
  chainTitle: string;
  completed: boolean;
};

type Props = {
  quests: Quest[];
};

export function QuestPanel({ quests }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-6">
      <h2 className="text-xl font-bold text-white mb-4">
        Quests
      </h2>

      <div className="space-y-3">
        {quests.map((q, idx) => {
          const locked =
            idx > 0 && !quests[idx - 1].completed;

          return (
            <div
              key={q.id}
              className={cn(
                "rounded-lg border p-4 transition",
                q.completed
                  ? "border-emerald-400/40 bg-emerald-400/10"
                  : locked
                  ? "border-white/10 opacity-50"
                  : "border-cyan-400/30 bg-cyan-400/5"
              )}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-white">
                    {q.title}
                  </div>
                  <div className="text-xs text-white/60">
                    {q.description}
                  </div>
                </div>

                <div className="text-sm text-white/70">
                  {q.completed ? "✓" : `${q.xp} XP`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
