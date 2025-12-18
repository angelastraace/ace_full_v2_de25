import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/auth/assertAdmin";
import { logAdminAction } from "@/lib/audit/logAdminAction";

export async function POST(req: Request) {
  const admin = await assertAdmin();

  const { pause, reason } = await req.json();

  await supabase
    .from("system_controls")
    .update({
      is_paused: pause,
      paused_reason: reason ?? null,
      paused_at: pause ? new Date().toISOString() : null,
    })
    .eq("id", 1);

  await logAdminAction({
    adminUserId: admin.id,
    action: pause ? "SYSTEM_PAUSE" : "SYSTEM_RESUME",
    metadata: { reason },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({ paused: pause });
}
