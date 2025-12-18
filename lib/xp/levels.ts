export function getLevelFromXP(totalXP: number) {
  if (totalXP < 100) return 1;
  if (totalXP < 250) return 2;
  if (totalXP < 500) return 3;
  if (totalXP < 1000) return 4;
  return Math.floor(totalXP / 500) + 3;
}

export function getXPForNextLevel(level: number) {
  if (level === 1) return 100;
  if (level === 2) return 250;
  if (level === 3) return 500;
  return (level - 2) * 500;
}
