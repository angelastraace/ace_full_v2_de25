// lib/player/updatePlayerState.ts
import { createServerClient } from "@/lib/supabase/server";
import { recomputePlayerState } from "./recomputePlayerState";

export async function updatePlayerState(userId: string, xpDelta: number) {
  const supabase = createServerClient();

  const { data: current } = await supabase
    .from("player_state_cache")
    .select("*")
    .eq("user_id", userId)
    .single();

  const baseState = current ?? {
    user_id: userId,
    xp: 0,
    level: 1,
    tier: "Bronze",
    trust_score: 100,
    flags: [],
  };

  const next = recomputePlayerState(baseState, xpDelta);

  await supabase.from("player_state_cache").upsert(next);

  return next;
}
