// lib/tier/tierRules.ts
export type Tier =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Diamond"
  | "ACE";

export const TIER_RULES: Record<Tier, {
  minLevel: number;
  requiresClaim: boolean;
  perks: string[];
}> = {
  Bronze: {
    minLevel: 1,
    requiresClaim: false,
    perks: ["base_xp"],
  },
  Silver: {
    minLevel: 25,
    requiresClaim: true,
    perks: ["xp_boost_5", "weekly_quests"],
  },
  Gold: {
    minLevel: 50,
    requiresClaim: true,
    perks: ["xp_boost_10", "reduced_fees"],
  },
  Diamond: {
    minLevel: 100,
    requiresClaim: true,
    perks: ["xp_boost_20", "priority_launchpad"],
  },
  ACE: {
    minLevel: 150,
    requiresClaim: false,
    perks: ["dao_access", "custom_badge"],
  },
};
