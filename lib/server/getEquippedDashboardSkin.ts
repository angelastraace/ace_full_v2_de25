import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getEquippedDashboardSkin(userId: string) {
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
    .from("user_cosmetics")
    .select(`
      cosmetic_skins (
        animated,
        metadata
      )
    `)
    .eq("user_id", userId)
    .eq("category", "dashboard_frame")
    .single();

  if (!data?.cosmetic_skins) return null;

  return {
    animated: data.cosmetic_skins.animated,
    metadata: data.cosmetic_skins.metadata,
  };
}
