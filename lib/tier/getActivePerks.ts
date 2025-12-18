// lib/tier/getActivePerks.ts
import { TIER_RULES, Tier } from "./tierRules";

export function getActivePerks(tier: Tier) {
  return TIER_RULES[tier].perks;
}
