// lib/fees/routeFee.ts
import { FEE_ROUTING } from "./feeRoutingRules";

export type FeeType = keyof typeof FEE_ROUTING;

export function routeFee(
  type: FeeType,
  feeAmount: number
) {
  const rule = FEE_ROUTING[type];

  if (!rule) {
    throw new Error(`No fee routing rule for fee type: ${type}`);
  }

  const routedAmount = Number(
    (feeAmount * rule.ratio).toFixed(8)
  );

  return {
    destination: rule.destination,
    routedAmount,
  };
}
