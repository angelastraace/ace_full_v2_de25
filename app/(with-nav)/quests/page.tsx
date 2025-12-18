import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getUserWithRoles } from "@/lib/auth/getUserWithRoles";
import QuestList from "./quest-list";

export default async function QuestsPage() {
  const auth = await getUserWithRoles();
  if (!auth) return null;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookies().get(n)?.value } }
  );

  const { data: quests } = await supabase
    .from("quests")
    .select("id, title, description, xp_reward")
    .eq("active", true);

  const { data: completed } = await supabase
    .from("user_quests")
    .select("quest_id")
    .eq("user_id", auth.user.id);

  const completedIds = new Set(
    (completed ?? []).map((q) => q.quest_id)
  );

  return (
    <div className="p-8 max-w-3xl text-white">
      <h1 className="text-3xl font-bold ace-glow mb-6">
        Quests
      </h1>

      <QuestList
        quests={quests ?? []}
        completedIds={completedIds}
      />
    </div>
  );
}
