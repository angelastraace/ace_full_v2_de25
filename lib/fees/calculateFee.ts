import { BASE_FEES, TIER_FEE_MULTIPLIER } from "./feeRules";
import { trustFeeModifier } from "./trustModifier";
import type { Tier } from "@/lib/tier/tierRules";

type FeeType = keyof typeof BASE_FEES;

export function calculateFee({
  amount,
  type,
  tier,
  trustScore,
}: {
  amount: number;
  type: FeeType;
  tier: Tier;
  trustScore: number;
}) {
  const baseFeeRate = BASE_FEES[type];
  const tierMultiplier = TIER_FEE_MULTIPLIER[tier];
  const trustMultiplier = trustFeeModifier(trustScore);

  const finalRate =
    baseFeeRate * tierMultiplier * trustMultiplier;

  const feeAmount = amount * finalRate;

  return {
    rate: finalRate,
    fee: Number(feeAmount.toFixed(8)),
  };
}
