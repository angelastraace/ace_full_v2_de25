// lib/xp/xpRules.ts
export const XP_RULES = {
  WINDOW: "hour" as "hour" | "day",

  CAPS: {
    hour: 2_000,
    day: 10_000,
  },

  DIMINISHING: [
    { threshold: 1.0, multiplier: 1.0 }, // <= 100%
    { threshold: 1.25, multiplier: 0.5 }, // 100–125%
    { threshold: 1.5, multiplier: 0.25 }, // 125–150%
    { threshold: Infinity, multiplier: 0.1 }, // >150%
  ],
};
