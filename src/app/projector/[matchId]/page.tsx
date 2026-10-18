import { Projector } from "@/app/_components/projector";
export default async function ProjectorPage({
	params,
}: {
	params: Promise<{ matchId: string }>;
}) {
	const { matchId } = await params;
	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-950 p-8 text-white">
			<Projector matchId={matchId} />
		</main>
	);
}
