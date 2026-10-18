"use client";

import { Countdown, useCountdown } from "@/app/_components/countdown";
import { api } from "@/trpc/react";

export function Projector({ matchId }: { matchId: string }) {
	const query = api.cyber.final.matchState.useQuery(
		{ matchId },
		{ refetchInterval: 1500 },
	);
	const match = query.data;
	const endsAt = match?.timerStartedAt
		? new Date(match.timerStartedAt.getTime() + match.durationSeconds * 1000)
		: null;
	const left = useCountdown(endsAt, match?.now);

	if (query.error) return <p className="text-2xl">Match unavailable</p>;
	if (!match) return <p className="animate-pulse text-3xl">Loading match…</p>;
	return (
		<div aria-live="polite" className="text-center">
			<p className="title-glow font-black font-display text-4xl tracking-[0.4em]">
				CYBER CLASH
			</p>
			<p className="mt-5 font-display text-2xl text-[var(--magenta)]">
				{match.stage === "final" ? "The Final" : "Semi-final"}
				{match.suddenDeath > 0 && (
					<span className="ml-4 animate-pulse text-rose-400">Sudden death</span>
				)}
			</p>
			<Countdown
				big
				className="mt-8 font-black font-display text-[clamp(5rem,22vw,16rem)] leading-none"
				endsAt={endsAt}
				serverNow={match.now}
			/>
			{left === 0 && (
				<p className="title-glow mt-4 font-display text-6xl text-rose-400">
					TIME
				</p>
			)}
			{match.winnerId && (
				<p className="title-glow mt-5 font-display text-5xl text-[var(--gold)]">
					We have a winner
				</p>
			)}
		</div>
	);
}
