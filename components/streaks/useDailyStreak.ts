"use client";

import { useEffect, useState } from "react";

export function useDailyStreak() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/streaks/daily", { method: "POST" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  return data;
}
