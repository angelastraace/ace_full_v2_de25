import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function getUserBadges() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookies().getAll(),
      },
    }
  );

  // 1️⃣ Fetch all badge definitions
  const { data: allBadges } = await supabase
    .from("badges")
    .select("code, name, description, icon, rarity")
    .order("rarity", { ascending: true });

  // 2️⃣ Fetch earned badge codes
  const { data: earned } = await supabase
    .from("user_badges")
    .select("badge");

  const earnedBadgeCodes = new Set(
    (earned ?? []).map((b) => b.badge)
  );

  return {
    allBadges: allBadges ?? [],
    earnedBadgeCodes,
  };
}
