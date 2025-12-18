import { NextResponse } from "next/server";
import { getUserWithRoles } from "../../../../lib/auth/getUserWithRoles";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  const auth = await getUserWithRoles();
  if (!auth || !auth.roles.includes("admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const { data } = await supabase
    .from("profiles")
    .select("id, email, roles");

  return NextResponse.json(data ?? []);
}
