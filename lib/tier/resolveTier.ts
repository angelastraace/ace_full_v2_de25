// lib/tier/resolveTier.ts
import { TIER_RULES, Tier } from "./tierRules";

export function resolveTier(level: number): Tier {
  const tiers = Object.entries(TIER_RULES) as [Tier, any][];

  return tiers
    .reverse()
    .find(([_, rule]) => level >= rule.minLevel)?.[0] ?? "Bronze";
}
