import { redirect } from "next/navigation";
import { getSession } from "@/server/better-auth/server";

export default async function PlayLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	if (!(await getSession())) redirect("/login");
	return <div className="min-h-screen">{children}</div>;
}
