"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AuditRow = {
  id: string;
  admin_user_id: string;
  action: string;
  target_id?: string;
  metadata?: any;
  created_at: string;
};

export default function AdminAuditLogPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);

  useEffect(() => {
    fetch("/api/admin/audit")
      .then((r) => r.json())
      .then((j) => setRows(j.rows ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Audit Log</h1>

      {rows.map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <CardTitle>{r.action}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div><strong>Admin:</strong> {r.admin_user_id}</div>
            {r.target_id && (
              <div><strong>Target:</strong> {r.target_id}</div>
            )}
            <div>
              <strong>Date:</strong>{" "}
              {new Date(r.created_at).toLocaleString()}
            </div>
            {r.metadata && (
              <pre className="text-xs bg-muted p-2 rounded">
                {JSON.stringify(r.metadata, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
