import { redirect } from "next/navigation";
import { LatestPost } from "@/app/_components/post";
import { getSession } from "@/server/better-auth/server";

export default async function PostsPage() {
	if (!(await getSession())) redirect("/login");
	return (
		<main className="mx-auto min-h-screen max-w-2xl space-y-6 px-6 py-12 text-slate-100">
			<a className="text-cyan-300 text-sm" href="/dashboard">
				← Dashboard
			</a>
			<h1 className="font-black text-3xl">Example posts</h1>
			<p className="text-slate-400">
				The starter project’s authenticated post demo remains available here.
			</p>
			<LatestPost />
		</main>
	);
}
