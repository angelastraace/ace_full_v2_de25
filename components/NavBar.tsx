import Link from "next/link";
import { getUserWithRoles } from "@/lib/auth/getUserWithRoles";
import { RoleBadge } from "./RoleBadge";

export default async function NavBar() {
  const auth = await getUserWithRoles();

  return (
    <nav className="flex items-center gap-4 text-white">
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/profile">Profile</Link>

      {auth?.roles.includes("admin") && (
        <Link href="/admin" className="text-red-400">
          Admin
        </Link>
      )}

      <div className="flex items-center">
        {auth?.roles.slice(0, 3).map((role) => (
          <RoleBadge key={role} role={role as any} />
        ))}
      </div>
    </nav>
  );
}
