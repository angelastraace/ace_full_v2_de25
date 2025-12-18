// lib/tier/canPromote.ts
import { TIER_RULES, Tier } from "./tierRules";

export function canPromote(
  currentTier: Tier,
  targetTier: Tier
) {
  return TIER_RULES[targetTier].requiresClaim;
}
