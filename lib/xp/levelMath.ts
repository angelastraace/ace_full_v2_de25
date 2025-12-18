export function xpForLevel(level: number) {
  return Math.pow(level - 1, 2) * 100;
}

export function xpForNextLevel(level: number) {
  return Math.pow(level, 2) * 100;
}

export function getLevelProgress(totalXP: number, level: number) {
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForNextLevel(level);

  const progressXP = totalXP - currentLevelXP;
  const neededXP = nextLevelXP - currentLevelXP;

  const percent = Math.min(
    100,
    Math.floor((progressXP / neededXP) * 100)
  );

  return {
    progressXP,
    neededXP,
    percent,
    nextLevelXP,
  };
}
