export type RewardKind =
  | "xp_boost"
  | "fee_rebate"
  | "token"
  | "nft";

export type SeasonReward = {
  rankFrom: number;
  rankTo: number;
  rewards: {
    kind: RewardKind;
    value: number | string;
  }[];
};

export const SEASON_REWARDS: SeasonReward[] = [
  {
    rankFrom: 1,
    rankTo: 1,
    rewards: [
      { kind: "xp_boost", value: 1.25 },
      { kind: "token", value: 500 },
      { kind: "nft", value: "ACE-SEASON-CHAMPION" },
    ],
  },
  {
    rankFrom: 2,
    rankTo: 10,
    rewards: [
      { kind: "xp_boost", value: 1.15 },
      { kind: "token", value: 200 },
    ],
  },
  {
    rankFrom: 11,
    rankTo: 100,
    rewards: [
      { kind: "xp_boost", value: 1.05 },
    ],
  },
];
