export type FeeDestination = "treasury" | "dao" | "burn";

export const FEE_ROUTING: Record<
  string,
  { destination: FeeDestination; ratio: number }
> = {
  trade: { destination: "treasury", ratio: 1.0 },
  swap: { destination: "treasury", ratio: 0.8 },
  lp_add: { destination: "dao", ratio: 1.0 },
  lp_remove: { destination: "dao", ratio: 1.0 },
  withdraw: { destination: "burn", ratio: 0.5 },
};
