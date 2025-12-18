import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getUserWithRoles } from "../../../../../lib/auth/getUserWithRoles";

export async function POST(req: Request) {
  const auth = await getUserWithRoles();
  if (!auth || !auth.roles.includes("admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, role, expiresAt } = await req.json();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookies().get(n)?.value } }
  );

  await supabase.from("user_roles").insert({
    user_id: userId,
    role,
    expires_at: expiresAt,
  });

  return NextResponse.json({ success: true });
}
