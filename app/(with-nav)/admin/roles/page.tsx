import { redirect } from "next/navigation";
import { getUserWithRoles } from "../../../../lib/auth/getUserWithRoles";
import AdminRolesClient from "./roles-client";

export default async function AdminRolesPage() {
  const auth = await getUserWithRoles();

  if (!auth || !auth.roles.includes("admin")) {
    redirect("/dashboard");
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Admin · Role Management</h1>
      <AdminRolesClient />
    </div>
  );
}
