import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getUserTier(userId: string) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookies().getAll(),
      },
    }
  );

  const { data } = await supabase
    .from("player_state_cache")
    .select("tier")
    .eq("user_id", userId)
    .single();

  return data?.tier ?? "Bronze";
}
