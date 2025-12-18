import { resolveLevel } from "@/lib/xp/resolveLevel";
import { resolveTier } from "@/lib/tier/resolveTier";

type PlayerState = {
  user_id: string;
  xp: number;
  level: number;
  tier: "Bronze" | "Silver" | "Gold" | "Diamond" | "ACE";
  trust_score?: number;
  flags?: string[];
  updated_at?: string;
};

export function recomputePlayerState(
  current: PlayerState,
  xpDelta: number
): PlayerState {
  const newXp = current.xp + xpDelta;

  // Resolve level from total XP
  const { level } = resolveLevel(newXp);

  // Resolve tier from level
  const resolvedTier = resolveTier(level);

  return {
    ...current,
    xp: newXp,
    level,
    tier:
      current.tier === resolvedTier
        ? current.tier
        : resolvedTier,
    updated_at: new Date().toISOString(),
  };
}
