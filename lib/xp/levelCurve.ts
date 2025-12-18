// lib/xp/levelCurve.ts
export function xpForLevel(level: number) {
  return Math.floor(100 * level ** 1.5);
}
