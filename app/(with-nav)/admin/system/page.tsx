"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SystemStatus = {
  is_paused: boolean;
  paused_reason?: string | null;
  paused_at?: string | null;
};

export default function AdminSystemControlPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadStatus() {
    const res = await fetch("/api/admin/system/status");
    const json = await res.json();
    setStatus(json);
  }

  async function pauseSystem() {
    if (!confirm("⚠️ Are you sure you want to PAUSE the system?")) return;

    setLoading(true);
    await fetch("/api/admin/system/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pause: true,
        reason: reason || "Manual emergency pause",
      }),
    });
    setReason("");
    await loadStatus();
    setLoading(false);
  }

  async function resumeSystem() {
    if (!confirm("Resume system operations?")) return;

    setLoading(true);
    await fetch("/api/admin/system/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pause: false }),
    });
    await loadStatus();
    setLoading(false);
  }

  useEffect(() => {
    loadStatus();
  }, []);

  if (!status) {
    return <div>Loading system status…</div>;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">🛑 System Control</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            Current Status:{" "}
            {status.is_paused ? "🛑 PAUSED" : "✅ ACTIVE"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {status.is_paused && (
            <div className="text-sm text-red-500">
              <strong>Reason:</strong>{" "}
              {status.paused_reason || "No reason provided"}
              <br />
              <strong>Paused at:</strong>{" "}
              {status.paused_at
                ? new Date(status.paused_at).toLocaleString()
                : "—"}
            </div>
          )}

          {!status.is_paused && (
            <>
              <Input
                placeholder="Pause reason (optional but recommended)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading}
              />

              <Button
                variant="destructive"
                onClick={pauseSystem}
                disabled={loading}
              >
                🛑 PAUSE SYSTEM
              </Button>
            </>
          )}

          {status.is_paused && (
            <Button
              variant="secondary"
              onClick={resumeSystem}
              disabled={loading}
            >
              ▶️ Resume System
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
