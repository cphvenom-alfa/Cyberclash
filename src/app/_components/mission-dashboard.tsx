"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Countdown } from "@/app/_components/countdown";
import { GlowButton } from "@/app/_components/glow-button";
import { AnimatedNumber, DecryptText, RoundTrack } from "@/app/_components/hud";
import { RoundDialog } from "@/app/_components/round-dialog";
import { ROUNDS, type RoundInfo } from "@/app/_components/rounds";
import { SignOutButton } from "@/app/_components/sign-out-button";
import { SpotlightCard } from "@/app/_components/spotlight-card";
import type { RouterOutputs } from "@/trpc/react";

type Team = NonNullable<RouterOutputs["cyber"]["team"]["me"]>;
type Match = RouterOutputs["cyber"]["final"]["myMatch"];

const ROUND_PATH: Record<number, string> = {
	1: "/play/round-1",
	2: "/play/round-2",
	3: "/play/round-3",
};

export function MissionDashboard({
	team,
	match,
	isAdmin,
	clockEndsAt,
	serverNow,
}: {
	team: Team;
	match: Match;
	isAdmin: boolean;
	clockEndsAt: Date | null;
	serverNow: Date;
}) {
	const [open, setOpen] = useState<RoundInfo | null>(null);
	const closeDialog = useCallback(() => setOpen(null), []);
	const current = Math.min(team.round, 4);
	const statusOf = (round: number) =>
		round < current ? "Complete" : round === current ? "Current" : "Locked";
	const active = ROUNDS.find((round) => round.n === current);
	const roundPath = ROUND_PATH[team.round];

	return (
		<main className="mx-auto max-w-4xl space-y-6 px-6 py-8 text-[var(--ink)]">
			<header className="flex items-end justify-between gap-4 pt-2">
				<h1 className="title-glow font-black font-display text-3xl tracking-widest sm:text-4xl">
					<DecryptText text="CYBER CLASH" />
				</h1>
				{isAdmin && (
					<nav
						aria-label="Organizer tools"
						className="flex gap-4 text-[var(--cyan)] text-sm"
					>
						<Link className="underline" href="/admin">
							Admin
						</Link>
						<Link className="underline" href="/admin/battle">
							Battle control
						</Link>
					</nav>
				)}
			</header>

			{team.eliminated ? (
				<section className="hud p-6">
					<p className="font-display text-xl">Signal lost</p>
					<p className="mt-2 text-[var(--dim)]">
						Thanks for playing, {team.name}. Your team did not advance this
						time. Stay and cheer on the finalists.
					</p>
				</section>
			) : (
				<>
					<SpotlightCard
						innerClassName="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"
						size={220}
					>
						<div className="space-y-3">
							<p className="text-[var(--dim)] text-sm">
								Welcome back, <b className="text-white">{team.name}</b>
							</p>
							<p className="font-display text-2xl">{active?.title}</p>
							<p className="max-w-md text-[var(--dim)] text-sm">
								{active?.tagline}
							</p>
							{roundPath ? (
								<GlowButton href={roundPath}>
									Enter Round {team.round}
								</GlowButton>
							) : !match ? (
								<p className="text-[var(--gold)]">
									You&apos;re a finalist. Organizers are setting up your match…
								</p>
							) : match.winnerId ? (
								<p
									className={`font-display text-2xl ${match.winnerId === team.id ? "title-glow text-[var(--gold)]" : "text-white/70"}`}
								>
									{match.winnerId !== team.id
										? "You were beaten in this match. Great run."
										: match.stage === "final"
											? "CHAMPIONS"
											: "You won this match. Wait for the next one."}
								</p>
							) : (
								<GlowButton href={`/play/battle/${match.id}`}>
									Enter your {match.stage} match
								</GlowButton>
							)}
						</div>
						<div className="text-center sm:text-right">
							<p className="text-[var(--dim)] text-xs">
								{team.round === 1 && clockEndsAt
									? "Round 1 clock"
									: "Mission clock"}
							</p>
							{team.round === 1 && clockEndsAt ? (
								<Countdown endsAt={clockEndsAt} serverNow={serverNow} />
							) : (
								<p className="mt-1 font-display text-[var(--cyan)] text-lg">
									{team.round === 1 ? "Standing by" : "Live"}
								</p>
							)}
						</div>
					</SpotlightCard>

					<div className="grid gap-5 sm:grid-cols-2">
						<SpotlightCard innerClassName="grid grid-cols-2 divide-x divide-white/10 p-5 text-center">
							<div>
								<p className="text-[var(--dim)] text-xs">Points</p>
								<p className="mt-1 font-display text-4xl text-[var(--gold)]">
									<AnimatedNumber value={team.points} />
								</p>
							</div>
							<div>
								<p className="text-[var(--dim)] text-xs">Round</p>
								<p className="mt-1 font-display text-4xl text-[var(--cyan)]">
									{current}
								</p>
							</div>
						</SpotlightCard>
						<SpotlightCard innerClassName="p-5">
							<RoundTrack current={current} />
						</SpotlightCard>
					</div>

					<section className="space-y-3">
						<h2 className="font-display text-lg">Mission briefings</h2>
						<div className="grid gap-5 sm:grid-cols-2">
							{ROUNDS.map((round) => {
								const status = statusOf(round.n);
								return (
									<SpotlightCard
										className={
											status === "Current" ? "border-[var(--cyan)]/70" : ""
										}
										innerClassName="flex h-full flex-col gap-3 p-5"
										key={round.n}
										size={160}
									>
										<div className="flex items-center justify-between">
											<span className="font-display text-[var(--cyan)]">
												Round {round.n}
											</span>
											<span
												className={`border px-2 py-0.5 text-xs ${status === "Current" ? "border-[var(--cyan)] text-[var(--cyan)]" : status === "Complete" ? "border-[var(--violet)] text-[var(--violet)]" : "border-white/15 text-white/40"}`}
											>
												{status}
											</span>
										</div>
										<p className="font-display text-lg">{round.title}</p>
										<p className="flex-1 text-[var(--dim)] text-sm">
											{round.tagline}
										</p>
										<div>
											<GlowButton onClick={() => setOpen(round)}>
												Briefing
											</GlowButton>
										</div>
									</SpotlightCard>
								);
							})}
						</div>
					</section>
				</>
			)}

			<footer className="flex items-center justify-between border-white/10 border-t pt-4 text-sm">
				<Link className="text-[var(--cyan)] underline" href="/posts">
					Posts demo
				</Link>
				<SignOutButton />
			</footer>
			<RoundDialog
				onClose={closeDialog}
				round={open}
				status={open ? statusOf(open.n) : ""}
			/>
		</main>
	);
}
