"use client";

import { useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  roles: string[];
};

const ALL_ROLES = ["admin", "founder", "vip", "dao_voter"];

export default function AdminRolesClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  async function toggleRole(userId: string, role: string) {
    await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              roles: u.roles.includes(role)
                ? u.roles.filter((r) => r !== role)
                : [...u.roles, role],
            }
          : u
      )
    );
  }

  async function addTimedRole(
    userId: string,
    role: string,
    expiresAt: string
  ) {
    if (!expiresAt) return;

    await fetch("/api/admin/roles/timed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        role,
        expiresAt,
      }),
    });

    alert(`Temporary ${role} granted`);
  }

  if (loading) return <p className="opacity-60">Loading users…</p>;

  return (
    <div className="space-y-6">
      {users.map((user) => (
        <div
          key={user.id}
          className="border border-white/10 rounded-lg p-4 bg-black/40"
        >
          {/* User identity */}
          <div className="font-semibold mb-3">{user.email}</div>

          {/* Permanent roles */}
          <div className="flex gap-2 flex-wrap mb-4">
            {ALL_ROLES.map((role) => {
              const active = user.roles.includes(role);

              return (
                <button
                  key={role}
                  onClick={() => toggleRole(user.id, role)}
                  className={`px-3 py-1 rounded text-sm transition
                    ${
                      active
                        ? "bg-green-600 shadow-[0_0_10px_rgba(0,255,140,0.8)]"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                >
                  {role}
                </button>
              );
            })}
          </div>

          {/* Timed role picker */}
          <div className="flex items-center gap-3">
            <span className="text-sm opacity-60">
              Grant temporary VIP until:
            </span>

            <input
              type="datetime-local"
              className="bg-black border border-white/20 px-2 py-1 rounded text-sm"
              onChange={(e) =>
                addTimedRole(user.id, "vip", e.target.value)
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}
