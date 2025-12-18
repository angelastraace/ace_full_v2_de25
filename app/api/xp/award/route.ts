import { NextResponse } from "next/server";
import { awardXP } from "@/lib/server/awardXP";
import { getUserWithRoles } from "@/lib/auth/getUserWithRoles";

export async function POST(req: Request) {
  try {
    const auth = await getUserWithRoles();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { baseXP, source } = await req.json();

    const result = await awardXP({
      userId: auth.user.id,
      roles: auth.roles,
      baseXP,
      source,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "XP award failed", message: err.message },
      { status: 500 }
    );
  }
}
