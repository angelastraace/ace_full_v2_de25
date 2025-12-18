export function calcStreakBonus(streak: number) {
  // Hard caps prevent abuse
  if (streak >= 30) return 500;
  if (streak >= 14) return 300;
  if (streak >= 7) return 150;
  if (streak >= 3) return 75;
  return 25;
}
