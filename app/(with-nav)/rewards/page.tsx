"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Reward = {
  id: string;
  season_id: string;
  season_name?: string;
  reward_kind: string;
  reward_value: string;
  delivered: boolean;
  created_at: string;
  onchain_settlement_queue?: {
    status: string;
    tx_hash?: string;
    confirmations?: number;
  } | null;
};

const rewardIcon = (kind: string) => {
  switch (kind) {
    case "token":
      return "💰";
    case "xp_boost":
      return "⚡";
    case "nft":
      return "🖼️";
    case "fee_rebate":
      return "🧾";
    default:
      return "🎁";
  }
};

const etherscanTx = (hash: string) =>
  `https://etherscan.io/tx/${hash}`;

export default function RewardHistoryPage() {
  const [grouped, setGrouped] = useState<Record<string, Reward[]>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    // 1️⃣ Fetch rewards
    const res = await fetch("/api/rewards/history");
    const json = await res.json();
    const rewards: Reward[] = json.rewards ?? [];

    // 2️⃣ Collect season IDs
    const seasonIds = Array.from(
      new Set(rewards.map(r => r.season_id))
    );

    // 3️⃣ Fetch season names
    const seasonMap: Record<string, string> = {};
    if (seasonIds.length > 0) {
      const res = await fetch("/api/seasons/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seasonIds }),
      });
      const json = await res.json();
      Object.assign(seasonMap, json.seasons);
    }

    // 4️⃣ Attach names + group
    const groupedRewards: Record<string, Reward[]> = {};

    for (const r of rewards) {
      const seasonName =
        seasonMap[r.season_id] ?? r.season_id;

      const key = seasonName;

      if (!groupedRewards[key]) {
        groupedRewards[key] = [];
      }

      groupedRewards[key].push({
        ...r,
        season_name: seasonName,
      });
    }

    setGrouped(groupedRewards);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div>Loading rewards…</div>;

  if (Object.keys(grouped).length === 0) {
    return <div>No rewards yet.</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Your Rewards</h1>

      {Object.entries(grouped).map(([season, rewards]) => (
        <div key={season} className="space-y-4">
          <h2 className="text-xl font-semibold">
            🏆 {season}
          </h2>

          {rewards.map((r) => (
            <Card key={r.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span>{rewardIcon(r.reward_kind)}</span>
                  <span className="capitalize">
                    {r.reward_kind.replace("_", " ")}
                  </span>
                </CardTitle>

                <Badge
                  variant={
                    r.onchain_settlement_queue?.status === "confirmed"
                      ? "default"
                      : r.onchain_settlement_queue?.status === "failed"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {r.onchain_settlement_queue?.status ??
                    (r.delivered ? "delivered" : "pending")}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-2 text-sm">
                <div>
                  <strong>Value:</strong>{" "}
                  {r.reward_value}
                </div>

                <div>
                  <strong>Date:</strong>{" "}
                  {new Date(r.created_at).toLocaleString()}
                </div>

                {r.onchain_settlement_queue?.tx_hash && (
                  <div className="text-xs break-all">
                    <strong>TX:</strong>{" "}
                    <a
                      href={etherscanTx(
                        r.onchain_settlement_queue.tx_hash
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {r.onchain_settlement_queue.tx_hash.slice(0, 10)}…
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
