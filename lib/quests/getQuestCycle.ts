export function getQuestCycle(cadence: "daily" | "weekly" | "once") {
  const now = new Date();

  if (cadence === "daily") {
    return now.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  if (cadence === "weekly") {
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor(
      (now.getTime() - firstDayOfYear.getTime()) / 86400000
    );
    const week = Math.ceil((days + firstDayOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${week}`;
  }

  return "once";
}
