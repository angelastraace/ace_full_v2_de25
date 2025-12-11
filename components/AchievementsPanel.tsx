"use client";
import React, { useEffect, useState } from "react";

type Achievement = {
  id: string;
  title: string;
  description?: string;
  xp: number;
  unlockedAt?: string | null;
};

export default function AchievementsPanel() {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/achievements");
        if (!res.ok) throw new Error("Failed to fetch achievements");
        const data = await res.json();
        if (!mounted) return;
        setAchievements(data.achievements || []);
      } catch (err: any) {
        setError(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div style={{padding:16}}>Loading achievements...</div>;
  if (error) return <div style={{padding:16, color:'crimson'}}>Error: {error}</div>;
  if (!achievements.length) return <div style={{padding:16}}>No achievements defined yet. Command will push new challenges soon.</div>;

  return (
    <div style={{padding:16}}>
      <h3>Achievements</h3>
      <ul>
        {achievements.map(a => (
          <li key={a.id} style={{marginBottom:8}}>
            <strong>{a.title}</strong> — {a.description || 'No description'} <small>({a.xp} XP)</small>
            {a.unlockedAt && <div style={{fontSize:12, color:'#666'}}>Unlocked: {new Date(a.unlockedAt).toLocaleString()}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
