import { NextResponse } from "next/server";
import { getUserWithRole } from "@/lib/auth/getUserWithRoles";

export async function POST() {
  const auth = await getUserWithRole();

  if (!auth || auth.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  // admin-only logic here
  return NextResponse.json({ success: true });
}
