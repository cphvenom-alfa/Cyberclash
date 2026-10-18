import Link from "next/link";
import { redirect } from "next/navigation";
import { RoundTwo } from "@/app/_components/round-two";
import { getSession } from "@/server/better-auth/server";
export default async function Page() {
	if (!(await getSession())) redirect("/login");
	return (
		<main className="mx-auto max-w-4xl px-6 py-12 text-slate-100">
			<Link className="text-cyan-300 text-sm" href="/dashboard">
				← Dashboard
			</Link>
			<div className="mt-8">
				<RoundTwo />
			</div>
		</main>
	);
}
