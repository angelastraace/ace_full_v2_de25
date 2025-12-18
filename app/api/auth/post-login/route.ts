import { NextResponse } from "next/server";
import { getUserWithRoles } from "@/lib/auth/getUserWithRoles";
import { completeQuestStep } from "@/lib/server/completeQuestStep";

export async function POST() {
  const auth = await getUserWithRoles();
  if (!auth) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await completeQuestStep({
    userId: auth.user.id,
    stepCode: "FIRST_LOGIN",
    roles: auth.roles,
  });

  return NextResponse.json({ ok: true });
}
