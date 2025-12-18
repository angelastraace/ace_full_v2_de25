"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Settlement = {
  id: string;
  kind: string;
  asset: string;
  amount: number;
  destination: string;
  status: string;
  tx_hash?: string;
  created_at: string;
};

export default function AdminSettlementsPage() {
  const [rows, setRows] = useState<Settlement[]>([]);
  const [stats, setStats] = useState<any[]>([]);

  async function load() {
    const res = await fetch("/api/admin/settlements/overview");
    const json = await res.json();
    setRows(json.rows);
    setStats(json.stats);
  }

  async function retry(id: string) {
    await fetch("/api/admin/settlements/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settlement Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s: any) => (
          <Card key={s.status}>
            <CardHeader>
              <CardTitle className="capitalize">
                {s.status}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl">
              {s.count}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Settlements</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th>Status</th>
                <th>Kind</th>
                <th>Asset</th>
                <th>Amount</th>
                <th>Destination</th>
                <th>TX</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td>{r.status}</td>
                  <td>{r.kind}</td>
                  <td>{r.asset}</td>
                  <td>{r.amount}</td>
                  <td>{r.destination}</td>
                  <td className="truncate max-w-[120px]">
                    {r.tx_hash ?? "—"}
                  </td>
                  <td>
                    {r.status === "failed" && (
                      <Button
                        size="sm"
                        onClick={() => retry(r.id)}
                      >
                        Retry
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
