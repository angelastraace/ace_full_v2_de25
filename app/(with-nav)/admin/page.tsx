import { redirect } from "next/navigation";
import { getUserWithRoles } from "../../../lib/auth/getUserWithRoles";

export default async function AdminPage() {
  const auth = await getUserWithRoles();

  if (!auth || !auth.roles.includes("admin")) {
    redirect("/dashboard");
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold">Admin Control Center</h1>
      <p className="mt-4 opacity-70">
        Restricted access. Admins only.
      </p>
    </div>
  );
}
