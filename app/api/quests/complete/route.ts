import { NextResponse } from "next/server";
import { getUserWithRoles } from "@/lib/auth/getUserWithRoles";
import { completeQuestStep } from "@/lib/server/completeQuestStep";

export async function POST(req: Request) {
  const auth = await getUserWithRoles();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { stepCode } = await req.json();

  const result = await completeQuestStep({
    userId: auth.user.id,
    stepCode,
    roles: auth.roles,
  });

  return NextResponse.json(result ?? { completed: false });
}
