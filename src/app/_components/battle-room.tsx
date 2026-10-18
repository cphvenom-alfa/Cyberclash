"use client";

import { useEffect, useRef, useState } from "react";
import { RingTimer, useCountdown } from "@/app/_components/countdown";
import { api } from "@/trpc/react";

export function BattleRoom({ matchId }: { matchId: string }) {
	const state = api.cyber.final.matchState.useQuery(
		{ matchId },
		{ refetchInterval: 1500 },
	);
	const assignment = api.cyber.final.myAssignment.useQuery(
		{ matchId },
		{ refetchInterval: 3000 },
	);
	const match = state.data;
	const started = Boolean(match?.timerStartedAt);
	const endsAt = match?.timerStartedAt
		? new Date(match.timerStartedAt.getTime() + match.durationSeconds * 1000)
		: null;
	const left = useCountdown(endsAt, match?.now);
	const opponent = api.cyber.final.routeChallengeToOpponent.useQuery(
		{ matchId },
		{ enabled: started, refetchInterval: started ? 3000 : false },
	);
	const [ciphertext, setCiphertext] = useState("");
	const [answer, setAnswer] = useState("");
	const encrypt = api.cyber.final.submitEncryptedChallenge.useMutation({
		onSuccess: () => void assignment.refetch(),
	});
	const submit = api.cyber.final.submitFinalDecryption.useMutation();
	const attempt = match?.suddenDeath ?? 0;
	const previousAttempt = useRef(attempt);
	useEffect(() => {
		if (previousAttempt.current === attempt) return;
		previousAttempt.current = attempt;
		setCiphertext("");
		setAnswer("");
		encrypt.reset();
		submit.reset();
		// Reset this attempt's drafts and mutation state when sudden death advances.
	}, [attempt, encrypt.reset, submit.reset]);

	return (
		<div className="space-y-6 text-[var(--ink)]">
			<header className="hud flex items-center justify-between gap-4 p-6">
				<div>
					<p className="font-mono text-[var(--cyan)] text-xs uppercase tracking-widest">
						{match?.stage ?? "Final"}
					</p>
					{attempt > 0 && (
						<p className="mt-2 animate-pulse font-display text-rose-400">
							SUDDEN DEATH · ATTEMPT {attempt + 1}
						</p>
					)}
				</div>
				<RingTimer endsAt={endsAt} serverNow={match?.now} />
			</header>

			{!started && (
				<section className="hud space-y-4 p-6">
					<h2 className="font-display text-xl">Encrypt your sentence</h2>
					{!assignment.data ? (
						<p className="text-[var(--dim)]">
							Waiting for organizers to assign your sentence…
						</p>
					) : (
						<>
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="border border-white/10 p-3">
									<p className="text-[var(--dim)] text-xs">Your sentence</p>
									<p className="mt-1 font-mono text-[var(--gold)]">
										{assignment.data.sentence}
									</p>
								</div>
								<div className="border border-white/10 p-3">
									<p className="text-[var(--dim)] text-xs">Cipher to use</p>
									<p className="mt-1 font-display text-[var(--magenta)]">
										{assignment.data.cipherType}
									</p>
								</div>
							</div>
							<textarea
								className="input-neon font-mono"
								disabled={assignment.data.approved || encrypt.isPending}
								maxLength={1000}
								onChange={(event) => setCiphertext(event.target.value)}
								placeholder="Type the encrypted version"
								rows={3}
								value={ciphertext}
							/>
							<button
								className="btn-neon"
								disabled={
									assignment.data.approved ||
									!ciphertext.trim() ||
									encrypt.isPending
								}
								onClick={() =>
									encrypt.mutate({ matchId, encryptedString: ciphertext })
								}
								type="button"
							>
								Send for approval
							</button>
							<p className="text-sm" role="status">
								{assignment.data.approved ? (
									<span className="text-emerald-300">
										Approved. Wait for the countdown.
									</span>
								) : assignment.data.encrypted ? (
									<span className="text-[var(--gold)]">
										Waiting for organizer approval…
									</span>
								) : (
									<span className="text-[var(--dim)]">Not submitted yet</span>
								)}
							</p>
						</>
					)}
				</section>
			)}

			{started && (
				<section className="hud space-y-4 p-6">
					<div className="flex items-center justify-between gap-4">
						<div>
							<h2 className="font-display text-xl">
								Decrypt your opponent&apos;s message
							</h2>
							<p className="mt-1 text-[var(--dim)] text-sm">
								Cipher:{" "}
								<b className="text-[var(--magenta)]">
									{opponent.data?.cipherType ?? "Loading…"}
								</b>
								. No hints. One attempt.
							</p>
						</div>
						<RingTimer endsAt={endsAt} serverNow={match?.now} />
					</div>
					<pre className="whitespace-pre-wrap break-words border border-[var(--cyan)]/40 bg-black/60 p-4 font-mono text-[var(--cyan)] shadow-[0_0_30px_rgba(34,211,238,.2)]">
						{opponent.data?.encrypted ?? "Receiving transmission…"}
					</pre>
					<input
						className="input-neon font-mono"
						disabled={left === 0 || submit.isSuccess}
						maxLength={1000}
						onChange={(event) => setAnswer(event.target.value)}
						onKeyDown={(event) => {
							if (
								event.key === "Enter" &&
								answer.trim() &&
								left !== 0 &&
								!submit.isSuccess &&
								!submit.isPending
							)
								submit.mutate({ matchId, answerString: answer });
						}}
						placeholder="Decrypted sentence"
						value={answer}
					/>
					<button
						className="btn-neon"
						disabled={
							left === 0 ||
							submit.isSuccess ||
							!answer.trim() ||
							submit.isPending
						}
						onClick={() => submit.mutate({ matchId, answerString: answer })}
						type="button"
					>
						Lock in answer
					</button>
					{submit.isSuccess && (
						<p className="stamp inline-block border border-emerald-400 px-2 py-0.5 font-display text-emerald-300">
							LOCKED IN
						</p>
					)}
					{submit.error && (
						<p className="text-rose-400" role="alert">
							{submit.error.message}
						</p>
					)}
				</section>
			)}
			{match?.winnerId && (
				<p className="hud p-4 text-center text-[var(--gold)]" role="status">
					The organizers have announced a winner.
				</p>
			)}
			{encrypt.error && (
				<p className="text-rose-400" role="alert">
					{encrypt.error.message}
				</p>
			)}
		</div>
	);
}
