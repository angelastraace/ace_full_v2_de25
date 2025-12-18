import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { QuestPanel } from "@/components/quests/QuestPanel";
import { WelcomeXpTrigger } from "@/components/xp/WelcomeXpTrigger";

import { getUserWithRoles } from "@/lib/auth/getUserWithRoles";
import { getUserQuests } from "@/lib/server/getUserQuests";
import { getEquippedDashboardSkin } from "@/lib/server/getEquippedDashboardSkin";
import { getUserTier } from "@/lib/server/getUserTier";
import { tierGte } from "@/lib/tier/tierRank";

export default async function DashboardPage() {
  // 🔐 Auth
  const auth = await getUserWithRoles();
  if (!auth) {
    redirect("/login"); // or /signup
  }

  // 🔗 Supabase server client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookies().getAll(),
      },
    }
  );

  // 📊 XP state (SAFE)
  const { data: xp } = await supabase
    .from("user_xp")
    .select("total_xp, level")
    .eq("user_id", auth.user.id)
    .single();

  const safeXp = xp ?? { total_xp: 0, level: 1 };

  // 🧭 Quests
  const quests = await getUserQuests(auth.user.id);

  // 🎨 Cosmetics
  const tier = await getUserTier(auth.user.id);
  const skin = await getEquippedDashboardSkin(auth.user.id);

  const equippedSkin =
    skin && skin.metadata?.min_tier
      ? tierGte(tier, skin.metadata.min_tier)
        ? skin
        : null
      : skin;

  // ✅ RENDER
  return (
    <div className="space-y-8">
      {/* First XP trigger */}
      <WelcomeXpTrigger />

      {/* Debug marker (remove later) */}
      <div className="text-white p-2 bg-green-600 rounded">
        DASHBOARD RENDERED
      </div>

      <DashboardClient
        level={safeXp.level}
        totalXP={safeXp.total_xp}
        skin={equippedSkin ?? undefined}
      />

      <div className="px-8">
        <QuestPanel quests={quests} />
      </div>
    </div>
  );
}
