import { supabaseAdmin } from "@/lib/supabase/admin";
import { awardXP } from "@/lib/server/awardXP";
import { checkChainCompletion } from "@/lib/server/checkChainCompletion";

export async function completeQuestStep({
  userId,
  stepCode,
  roles,
}: {
  userId: string;
  stepCode: string;
  roles: string[];
}) {
  // Fetch step + chain
  const { data: step } = await supabaseAdmin
    .from("quest_steps")
    .select("id, xp_reward, badge_code, chain_id")
    .eq("code", stepCode)
    .single();

  if (!step) return null;

  // Already completed?
  const { data: existing } = await supabaseAdmin
    .from("user_quest_progress")
    .select("completed_at")
    .eq("user_id", userId)
    .eq("step_id", step.id)
    .maybeSingle();

  if (existing?.completed_at) return null;

  // Mark step complete
  await supabaseAdmin.from("user_quest_progress").insert({
    user_id: userId,
    step_id: step.id,
    completed_at: new Date().toISOString(),
  });

  // Award step XP
  if (step.xp_reward > 0) {
    await awardXP({
      userId,
      roles,
      baseXP: step.xp_reward,
      source: "quest",
    });
  }

  // 🔗 Check chain completion
  const chainResult = await checkChainCompletion({
    userId,
    chainId: step.chain_id,
    roles,
  });

  return {
    stepCompleted: true,
    stepBadge: step.badge_code,
    chainCompleted: !!chainResult,
    chainBadge: chainResult?.badgeCode ?? null,
    chainXP: chainResult?.xp ?? 0,
  };
}
