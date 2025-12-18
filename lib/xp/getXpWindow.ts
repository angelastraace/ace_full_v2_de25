// lib/xp/getXpWindow.ts
export function getXpWindowStart(
  date = new Date(),
  window: "hour" | "day"
) {
  const d = new Date(date);

  if (window === "hour") {
    d.setMinutes(0, 0, 0);
  } else {
    d.setHours(0, 0, 0, 0);
  }

  return d.toISOString();
}
