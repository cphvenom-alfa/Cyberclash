"use client";

import { useEffect, useRef, useState } from "react";
import { RingTimer, useCountdown } from "@/app/_components/countdown";
import { AnimatedNumber } from "@/app/_components/hud";
import { api } from "@/trpc/react";

export function RoundOne() {
	const questions = api.cyber.round1.questions.useQuery();
	const state = api.cyber.round1.state.useQuery(undefined, {
		refetchInterval: 5000,
	});
	const balance = api.cyber.round1.calculatePointCurrency.useQuery();
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [done, setDone] = useState<Record<string, boolean>>({});
	const autoSubmittedFor = useRef<number | null>(null);
	const left = useCountdown(state.data?.endsAt, state.data?.now);
	const active = state.data?.round === 1 && left !== null && left > 0;
	const submit = api.cyber.round1.submitQuizAnswer.useMutation({
		onSuccess: (_result, variables) => {
			setDone((previous) => ({ ...previous, [variables.questionId]: true }));
			void balance.refetch();
		},
	});
	useEffect(() => {
		const endsAt = state.data?.endsAt?.getTime();
		if (
			endsAt !== undefined &&
			questions.data &&
			autoSubmittedFor.current !== endsAt &&
			left === 0
		) {
			autoSubmittedFor.current = endsAt;
			for (const question of questions.data) {
				const answer = answers[question.id]?.trim();
				if (answer && !done[question.id])
					submit.mutate({ questionId: question.id, answerString: answer });
			}
		}
	}, [answers, done, left, questions.data, state.data?.endsAt, submit]);

	const total = questions.data?.length ?? 0;
	const locked = Object.values(done).filter(Boolean).length;
	const waiting = state.data?.round !== 1;

	return (
		<section className="space-y-6 text-[var(--ink)]">
			<header className="hud flex flex-col items-center gap-5 p-6 sm:flex-row sm:justify-between">
				<div>
					<p className="font-mono text-[var(--cyan)] text-xs tracking-[0.25em]">
						COMPETITION · ROUND 01
					</p>
					<h1 className="title-glow mt-2 font-black font-display text-2xl sm:text-3xl">
						SYSTEM ACTIVATION
					</h1>
					<p className="mt-2 text-[var(--dim)] text-sm">
						{waiting
							? "Waiting for the organizer to start this round."
							: active
								? "Submit your answers before time runs out."
								: "Round closed. Your saved answers were submitted."}
					</p>
					<p className="mt-4 font-mono text-[var(--gold)] text-sm">
						POINTS: <AnimatedNumber value={balance.data?.points ?? 0} />
					</p>
				</div>
				<RingTimer
					endsAt={state.data?.endsAt ?? null}
					serverNow={state.data?.now}
				/>
			</header>

			<div className="space-y-3">
				<div className="flex justify-between font-mono text-[var(--dim)] text-xs">
					<span>ANSWERS LOCKED</span>
					<span>
						{locked} / {total}
					</span>
				</div>
				<div
					aria-label={`${locked} of ${total} answers locked`}
					aria-valuemax={total}
					aria-valuenow={locked}
					className="h-1.5 overflow-hidden bg-white/10"
					role="progressbar"
				>
					<div
						className="h-full bg-gradient-to-r from-[var(--cyan)] to-[var(--violet)] transition-[width] duration-500"
						style={{ width: `${total ? (locked / total) * 100 : 0}%` }}
					/>
				</div>
			</div>

			{left === 0 && (
				<p className="hud p-4 text-[var(--gold)] text-sm" role="status">
					Time is up. Wait for the organizer to advance the event.
				</p>
			)}
			<div className="space-y-4">
				{questions.data?.map((question, index) => (
					<form
						className={`hud p-5 sm:p-6 ${done[question.id] ? "hud-win" : ""}`}
						key={question.id}
						onSubmit={(event) => {
							event.preventDefault();
							submit.mutate({
								questionId: question.id,
								answerString: answers[question.id] ?? "",
							});
						}}
					>
						<div className="flex items-start justify-between gap-3">
							<p className="font-display text-sm leading-relaxed sm:text-base">
								<span className="mr-2 font-mono text-[var(--cyan)]">
									[{String(index + 1).padStart(2, "0")}]
								</span>
								{question.prompt}
							</p>
							{done[question.id] && (
								<span className="stamp shrink-0 font-mono text-emerald-300 text-xs">
									LOCKED
								</span>
							)}
						</div>
						<div className="mt-5 flex flex-col gap-3 sm:flex-row">
							<input
								aria-label={`Answer for question ${index + 1}`}
								className="input-neon min-w-0 flex-1"
								disabled={!active || done[question.id]}
								onChange={(event) =>
									setAnswers((previous) => ({
										...previous,
										[question.id]: event.target.value,
									}))
								}
								placeholder="Enter your answer"
								value={answers[question.id] ?? ""}
							/>
							<button
								className="btn-neon"
								disabled={
									!active ||
									done[question.id] ||
									!answers[question.id]?.trim() ||
									submit.isPending
								}
								type="submit"
							>
								{done[question.id] ? "Answer locked" : "Submit answer"}
							</button>
						</div>
					</form>
				))}
			</div>
			{submit.error && (
				<p className="hud border-rose-400/50 p-4 text-rose-300" role="alert">
					{submit.error.message}
				</p>
			)}
		</section>
	);
}
