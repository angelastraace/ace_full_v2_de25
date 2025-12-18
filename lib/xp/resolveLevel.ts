// lib/xp/resolveLevel.ts
import { xpForLevel } from "./levelCurve";

export function resolveLevel(totalXp: number) {
  let level = 1;
  let remainingXp = totalXp;

  while (remainingXp >= xpForLevel(level)) {
    remainingXp -= xpForLevel(level);
    level++;
  }

  return { level, xpIntoLevel: remainingXp };
}
