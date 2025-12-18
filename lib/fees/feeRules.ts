import type { Tier } from "@/lib/tier/tierRules";

export const BASE_FEES = {
  trade: 0.001,        // 0.10%
  swap: 0.002,         // 0.20%
  lp_add: 0.0005,      // 0.05%
  lp_remove: 0.0005,
  withdraw: 0.001,
};

export const TIER_FEE_MULTIPLIER: Record<Tier, number> = {
  Bronze: 1.0,
  Silver: 0.95,
  Gold: 0.85,
  Diamond: 0.75,
  ACE: 0.5,
};
