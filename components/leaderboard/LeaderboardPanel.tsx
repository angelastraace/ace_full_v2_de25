"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/app/lib/utils";

type Entry = {
  rank: number;
  username: string;
  xp: number;
  level?: number;
  avatar?: string | null;
};

export function LeaderboardPanel() {
  const [type, setType] = useState<
    "all" | "weekly" | "season" | "friends"
  >("all");

  const [rows, setRows] = useState<Entry[]>([]);
  const prevRanks = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const url =
      type === "all"
        ? "/api/leaderboard"
        : `/api/leaderboard?type=${type}`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        const leaderboard: Entry[] = d.leaderboard ?? [];

        // Save previous ranks for animation
        const map = new Map<string, number>();
        rows.forEach((r) => map.set(r.username, r.rank));
        prevRanks.current = map;

        setRows(leaderboard);
      })
      .catch(() => {});
  }, [type]);

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">
          Leaderboard
        </h2>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setType("all")}
            className={cn(
              "px-3 py-1 rounded text-sm transition",
              type === "all"
                ? "bg-cyan-400 text-black"
                : "bg-white/10 text-white"
            )}
          >
            All-time
          </button>

          <button
            onClick={() => setType("weekly")}
            className={cn(
              "px-3 py-1 rounded text-sm transition",
              type === "weekly"
                ? "bg-cyan-400 text-black"
                : "bg-white/10 text-white"
            )}
          >
            Weekly
          </button>

          <button
            onClick={() => setType("season")}
            className={cn(
              "px-3 py-1 rounded text-sm transition",
              type === "season"
                ? "bg-cyan-400 text-black"
                : "bg-white/10 text-white"
            )}
          >
            Season
          </button>

          <button
            onClick={() => setType("friends")}
            className={cn(
              "px-3 py-1 rounded text-sm transition",
              type === "friends"
                ? "bg-cyan-400 text-black"
                : "bg-white/10 text-white"
            )}
          >
            Friends
          </button>
        </div>
      </div>

      <div className="space-y-2 relative">
        <AnimatePresence>
          {rows.map((r) => {
            const prevRank = prevRanks.current.get(r.username);
            const improved =
              prevRank !== undefined && r.rank < prevRank;

            return (
              <motion.div
                key={r.username}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className={cn(
                  "flex justify-between items-center rounded-lg px-4 py-2 border transition-shadow",
                  r.rank === 1 &&
                    "border-yellow-400 bg-yellow-400/20 shadow-[0_0_25px_rgba(250,204,21,0.6)]",
                  r.rank === 2 &&
                    "border-gray-300 bg-gray-300/15",
                  r.rank === 3 &&
                    "border-amber-700 bg-amber-700/15",
                  improved &&
                    "ring-2 ring-emerald-400/60 animate-pulse"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-bold">
                    #{r.rank}
                  </span>
                  <span className="font-semibold">
                    {r.username}
                  </span>
                  {improved && (
                    <span className="text-xs text-emerald-400">
                      ▲
                    </span>
                  )}
                </div>

                <div className="text-sm text-white/70">
                  {r.xp} XP
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
