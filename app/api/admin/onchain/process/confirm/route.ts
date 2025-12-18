import { NextResponse } from "next/server";
import { confirmOnchainSettlements } from "@/lib/onchain/confirmWorker";
import { assertAdmin } from "@/lib/auth/assertAdmin";
import { logAdminAction } from "@/lib/audit/logAdminAction";

export async function POST(req: Request) {
  const admin = await assertAdmin();

  await confirmOnchainSettlements();

  await logAdminAction({
    adminUserId: admin.id,
    action: "SETTLEMENT_CONFIRM",
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({ confirmed: true });
}
