// lib/xp/normalizeXp.ts
import { XP_RULES } from "./xpRules";

export function normalizeXp(
  requestedXp: number,
  alreadyEarned: number,
  cap: number
) {
  const totalAfter = alreadyEarned + requestedXp;
  const ratio = totalAfter / cap;

  let multiplier = 1.0;

  for (const step of XP_RULES.DIMINISHING) {
    if (ratio <= step.threshold) {
      multiplier = step.multiplier;
      break;
    }
  }

  const effectiveXp = Math.floor(requestedXp * multiplier);

  return {
    effectiveXp,
    multiplier,
    capped: multiplier < 1,
  };
}
