import { NextResponse } from "next/server";
import { processSettlementBatch } from "@/lib/onchain/settlementWorker";
import { assertAdmin } from "@/lib/auth/assertAdmin";
import { logAdminAction } from "@/lib/audit/logAdminAction";

export async function POST(req: Request) {
  const admin = await assertAdmin();

  await processSettlementBatch(10);

  await logAdminAction({
    adminUserId: admin.id,
    action: "SETTLEMENT_PROCESS_BATCH",
    metadata: { batchSize: 10 },
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({ processed: true });
}
