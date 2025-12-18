import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getUserWithRoles } from "../../../../lib/auth/getUserWithRoles";

export async function POST(req: Request) {
  // 1️⃣ Verify admin
  const auth = await getUserWithRoles();
  if (!auth || !auth.roles.includes("admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, role } = await req.json();

  // 2️⃣ Create Supabase server client
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  );

  // 3️⃣ Fetch current roles
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", userId)
    .single();

  const roles: string[] = profile?.roles ?? [];

  const updatedRoles = roles.includes(role)
    ? roles.filter((r) => r !== role)
    : [...roles, role];

  // 4️⃣ Update roles
  await supabase
    .from("profiles")
    .update({ roles: updatedRoles })
    .eq("id", userId);

  // 5️⃣ 🔥 AUDIT LOG (THIS IS THE LINE YOU ASKED ABOUT)
  await supabase.from("admin_audit_log").insert({
    admin_id: auth.user.id,
    action: "toggle_role",
    target_user: userId,
    metadata: {
      role,
      operation: roles.includes(role) ? "removed" : "added",
    },
  });

  // 6️⃣ Done
  return NextResponse.json({ success: true });
}
