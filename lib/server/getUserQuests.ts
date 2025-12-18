import { supabaseAdmin } from "@/lib/supabase/admin";

export async function getUserQuests(userId: string) {
  // All quest steps with chain info
  const { data: steps } = await supabaseAdmin
    .from("quest_steps")
    .select(`
      id,
      step_index,
      code,
      title,
      description,
      xp_reward,
      badge_code,
      chain:quest_chains (
        id,
        code,
        title
      )
    `)
    .order("step_index");

  if (!steps) {
    return [];
  }

  // User progress
  const { data: progress } = await supabaseAdmin
    .from("user_quest_progress")
    .select("step_id, completed_at")
    .eq("user_id", userId);

  const completed = new Set(
    progress?.map((p) => p.step_id) ?? []
  );

  return steps.map((step) => ({
    id: step.id,
    code: step.code,
    title: step.title,
    description: step.description,
    xp: step.xp_reward,
    badge: step.badge_code,
    chainTitle: step.chain?.title ?? "Quest",
    completed: completed.has(step.id),
  }));
}
