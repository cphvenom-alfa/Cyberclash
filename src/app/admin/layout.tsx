import { redirect } from "next/navigation";
import { getSession } from "@/server/better-auth/server";
import { AdminNav } from "@/app/_components/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());
  if (!admins.includes(session.user.email)) redirect("/dashboard");
  return (
    <div className="min-h-screen">
      <AdminNav />
      {children}
    </div>
  );
}