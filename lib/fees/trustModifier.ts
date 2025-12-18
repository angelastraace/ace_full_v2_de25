export function trustFeeModifier(trustScore: number) {
  if (trustScore >= 90) return 0.95;
  if (trustScore >= 75) return 1.0;
  if (trustScore >= 50) return 1.05;
  return 1.15;
}
