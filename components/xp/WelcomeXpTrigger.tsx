"use client";

import { useEffect, useState } from "react";

export function WelcomeXpTrigger() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    async function grant() {
      const res = await fetch("/api/xp/welcome", {
        method: "POST",
      });
      const json = await res.json();

      if (json.granted && json.xp) {
        setShown(true);
      }
    }

    grant();
  }, []);

  if (!shown) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-black border border-gray-800 rounded-lg px-4 py-3 shadow-xl animate-fade-in">
      <p className="text-sm text-gray-300">
        🎉 <strong>+50 XP</strong> earned
      </p>
      <p className="text-xs text-gray-500">
        Welcome to ACE
      </p>
    </div>
  );
}
