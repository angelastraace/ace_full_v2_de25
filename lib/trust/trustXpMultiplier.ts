export function trustXpMultiplier(trustScore: number) {
  if (trustScore >= 90) return 1.0;
  if (trustScore >= 75) return 0.9;
  if (trustScore >= 50) return 0.7;
  if (trustScore >= 25) return 0.4;
  return 0.1;
}
