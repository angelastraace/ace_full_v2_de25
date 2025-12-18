import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/auth/assertAdmin";
import { logAdminAction } from "@/lib/audit/logAdminAction";

export async function POST(req: Request) {
  const admin = await assertAdmin();
  const { proposalId } = await req.json();

  // apply logic here...

  await logAdminAction({
    adminUserId: admin.id,
    action: "DAO_APPLY_PROPOSAL",
    targetId: proposalId,
  });

  return NextResponse.json({ applied: true });
}
