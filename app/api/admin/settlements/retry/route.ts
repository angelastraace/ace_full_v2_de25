import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/auth/assertAdmin";
import { logAdminAction } from "@/lib/audit/logAdminAction";

export async function POST(req: Request) {
  const admin = await assertAdmin();
  const { id } = await req.json();

  await supabase
    .from("onchain_settlement_queue")
    .update({
      status: "queued",
      tx_hash: null,
      confirmations: 0,
      last_checked_at: null,
    })
    .eq("id", id);

  await logAdminAction({
    adminUserId: admin.id,
    action: "SETTLEMENT_RETRY",
    targetId: id,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({ retried: true });
}
