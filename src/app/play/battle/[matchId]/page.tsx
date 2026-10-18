import { redirect } from "next/navigation";
import { BattleRoom } from "@/app/_components/battle-room";
import { getSession } from "@/server/better-auth/server";
export default async function BattlePage({
	params,
}: {
	params: Promise<{ matchId: string }>;
}) {
	if (!(await getSession())) redirect("/login");
	const { matchId } = await params;
	return (
		<main className="mx-auto max-w-4xl px-6 py-12 text-slate-100">
			<a className="text-cyan-300 text-sm" href="/dashboard">
				← Dashboard
			</a>
			<h1 className="my-8 font-black text-3xl">Final battle</h1>
			<BattleRoom matchId={matchId} />
		</main>
	);
}
