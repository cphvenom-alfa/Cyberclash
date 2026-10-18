import Link from "next/link";
import { redirect } from "next/navigation";
import { DecryptText } from "@/app/_components/hud";
import { MissionDashboard } from "@/app/_components/mission-dashboard";
import { SignOutButton } from "@/app/_components/sign-out-button";
import { TeamSetup } from "@/app/_components/team-setup";
import { getSession } from "@/server/better-auth/server";
import { api, HydrateClient } from "@/trpc/server";

export default async function DashboardPage() {
	const session = await getSession();
	if (!session) redirect("/login");
	const admins = (process.env.ADMIN_EMAILS ?? "")
		.split(",")
		.map((email) => email.trim());
	const isAdmin = admins.includes(session.user.email);
	const team = await api.cyber.team.me().catch(() => null);
	if (!team)
		return (
			<HydrateClient>
				<main className="mx-auto min-h-screen max-w-2xl space-y-5 px-6 py-12 text-[var(--ink)]">
					<p className="title-glow font-black font-display text-3xl tracking-widest">
						<DecryptText text="CYBER CLASH" />
					</p>
					<h1 className="mt-4 font-bold font-display text-2xl">
						Welcome, {session.user.name}
					</h1>
					<div className="mt-4 flex gap-4">
						<SignOutButton />
						{isAdmin && (
							<Link className="text-cyan-300 underline" href="/admin">
								Organizer console
							</Link>
						)}
					</div>
					{!isAdmin && <TeamSetup />}
				</main>
			</HydrateClient>
		);
	const match = team.round >= 4 ? await api.cyber.final.myMatch() : null;
	const clock = await api.cyber.round1.state().catch(() => null);
	return (
		<HydrateClient>
			<MissionDashboard
				clockEndsAt={clock?.endsAt ?? null}
				isAdmin={isAdmin}
				match={match}
				serverNow={clock?.now ?? new Date()}
				team={team}
			/>
		</HydrateClient>
	);
}
