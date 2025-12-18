import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function getUserWithRoles() {
  const cookieStore = cookies();

  // 🔒 READ-ONLY Supabase client (NO set/remove)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    }
  );

  // ✅ Safe in Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch roles (example table: user_roles)
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  return {
    user,
    roles: roles?.map((r) => r.role) ?? [],
  };
}
