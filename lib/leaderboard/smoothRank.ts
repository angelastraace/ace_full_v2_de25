// lib/leaderboard/smoothRank.ts
import { RANK_RULES } from "./rankRules";

export function smoothRank(
  currentDisplay: number,
  trueRank: number
) {
  const delta = trueRank - currentDisplay;

  if (Math.abs(delta) <= RANK_RULES.MAX_DELTA_PER_TICK) {
    return {
      displayRank: trueRank,
      delta,
      surging: false,
    };
  }

  const step =
    delta > 0
      ? RANK_RULES.MAX_DELTA_PER_TICK
      : -RANK_RULES.MAX_DELTA_PER_TICK;

  return {
    displayRank: currentDisplay + step,
    delta,
    surging: true,
  };
}
