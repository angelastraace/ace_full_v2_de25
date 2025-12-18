export function getXPMultiplier(roles: string[]) {
  if (roles.includes("founder")) return 3;
  if (roles.includes("admin")) return 2;
  if (roles.includes("vip")) return 1.5;
  return 1;
}const baseXP = 100;
const multiplier = getXPMultiplier(user.roles);
const totalXP = baseXP * multiplier;
