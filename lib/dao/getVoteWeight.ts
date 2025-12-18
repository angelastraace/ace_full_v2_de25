export function getVoteWeight(roles: string[]) {
  if (roles.includes("founder")) return 10;
  if (roles.includes("admin")) return 5;
  if (roles.includes("dao_voter")) return 2;
  return 1;
}
