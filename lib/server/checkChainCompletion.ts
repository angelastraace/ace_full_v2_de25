import { supabaseAdmin } from "@/lib/supabase/admin";
import { awardXP } from "@/lib/server/awardXP";

export async function checkChainCompletion({
  userId,
  chainId,
  roles,
}: {
  userId: string;
  chainId: string;
  roles: string[];
}) {
  // Total steps in chain
  const { count: totalSteps } = await supabaseAdmin
    .from("quest_steps")
    .select("id", { count: "exact", head: true })
    .eq("chain_id", chainId);

  // Completed steps by user
  const { count: completedSteps } = await supabaseAdmin
    .from("user_quest_progress")
    .select("step_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in(
      "step_id",
      supabaseAdmin
        .from("quest_steps")
        .select("id")
        .eq("chain_id", chainId)
    );

  if (!totalSteps || completedSteps !== totalSteps) {
    return null;
  }

  // Fetch chain reward
  const { data: chain } = await supabaseAdmin
    .from("quest_chains")
    .select("completion_xp, completion_badge_code")
    .eq("id", chainId)
    .single();

  if (!chain) return null;

  // Award XP once
  if (chain.completion_xp > 0) {
    await awardXP({
      userId,
      roles,
      baseXP: chain.completion_xp,
      source: "quest",
    });
  }

  return {
    completed: true,
    badgeCode: chain.completion_badge_code,
    xp: chain.completion_xp,
  };
}
