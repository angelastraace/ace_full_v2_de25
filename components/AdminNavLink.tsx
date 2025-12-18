"use client";

import Link from "next/link";

export function AdminNavLink({ role }: { role: string | null }) {
  if (role !== "admin") return null;

  return (
    <Link href="/admin" className="text-red-400">
      Admin
    </Link>
  );
}
