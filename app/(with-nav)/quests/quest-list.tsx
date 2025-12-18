"use client";

import { useState } from "react";

type Quest = {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  cadence: "once" | "daily" | "weekly";
};

export default function QuestList({
  quests,
  completedIds,
}: {
  quests: Quest[];
  completedIds: Set<string>;
}) {
  const [completed, setCompleted] = useState<Set<string>>(
    new Set(completedIds)
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function completeQuest(quest: Quest) {
    try {
      setLoadingId(quest.id);

      const res = await fetch("/api/quests/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questId: quest.id,
          xp: quest.xp_reward,
          cadence: quest.cadence, // once | daily | weekly
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to complete quest");
      }

      // Mark quest as completed locally (per cycle)
      setCompleted((prev) => {
        const next = new Set(prev);
        next.add(quest.id);
        return next;
      });
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {quests.map((q) => {
        const isCompleted = completed.has(q.id);
        const isLoading = loadingId === q.id;

        return (
          <div
            key={q.id}
            className="border border-white/10 rounded-lg p-4 bg-black/40"
          >
            {/* Quest header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{q.title}</h3>

                {/* Cadence label */}
                <div className="text-xs opacity-60 mb-1">
                  {q.cadence === "daily" && "⏳ Daily Quest"}
                  {q.cadence === "weekly" && "📅 Weekly Quest"}
                  {q.cadence === "once" && "⭐ One-time Quest"}
                </div>

                <p className="opacity-70 text-sm">{q.description}</p>
              </div>

              {/* XP + Button */}
              <div className="text-right">
                <div className="font-mono text-cyan-400">
                  +{q.xp_reward} XP
                </div>

                <button
                  disabled={isCompleted || isLoading}
                  onClick={() => completeQuest(q)}
                  className={`mt-2 px-4 py-1 rounded text-sm transition
                    ${
                      isCompleted
                        ? "bg-green-700 opacity-60 cursor-not-allowed"
                        : isLoading
                        ? "bg-cyan-600 opacity-60"
                        : "bg-cyan-600 hover:bg-cyan-500 pulse-glow"
                    }`}
                >
                  {isCompleted
                    ? "Completed"
                    : isLoading
                    ? "Claiming..."
                    : "Claim"}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {quests.length === 0 && (
        <p className="opacity-60">No active quests.</p>
      )}
    </div>
  );
}
