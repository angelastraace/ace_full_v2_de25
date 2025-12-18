export function getXPMultiplier(roles: string[] = []) {
  if (roles.includes("admin")) return 2;
  if (roles.includes("vip")) return 1.5;

  return 1;
}
