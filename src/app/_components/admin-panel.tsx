"use client";
import { useState } from "react";
import { api } from "@/trpc/react";

const answerLabels = Array.from({ length: 7 }, (_, i) => `Finding ${i + 1}`);

export function AdminPanel() {
	const utils = api.useUtils();
	const teams = api.cyber.team.adminList.useQuery();
	const [minutes, setMinutes] = useState(30);
	const [count, setCount] = useState(8);
	const [message, setMessage] = useState("");
	const start = api.cyber.round1.startRoundOneTimer.useMutation({
		onSuccess: (r) =>
			setMessage(`Round 1 closes at ${r.endsAt.toLocaleTimeString()}`),
	});
	const advance = api.cyber.round1.advanceAllTeamsToRoundTwo.useMutation({
		onSuccess: () => {
			setMessage("All teams advanced to round 2.");
			void utils.cyber.team.adminList.invalidate();
		},
	});
	const scores = api.cyber.round2.calculateRoundTwoScore.useQuery();
	const shortlist = api.cyber.round2.shortlistTeamsForRoundThree.useMutation({
		onSuccess: (r) =>
			setMessage(`${r.advanced.length} teams advanced to round 3.`),
	});
	const submissions = api.cyber.round3.listSubmissions.useQuery();
	const grade = api.cyber.round3.submitAdminScore.useMutation({
		onSuccess: () => void utils.cyber.round3.listSubmissions.invalidate(),
	});
	const finalists = api.cyber.round3.shortlistTopFourForFinal.useMutation({
		onSuccess: (r) => setMessage(`${r.finalists.length} finalists selected.`),
	});
	const round3Status = api.cyber.round3.status.useQuery(undefined, {
		refetchInterval: 10_000,
	});
	const setSubmissionsClosed =
		api.cyber.round3.setSubmissionsClosed.useMutation({
			onSuccess: (result) => {
				setMessage(
					result.closed
						? "Round 3 submissions closed."
						: "Round 3 submissions reopened.",
				);
				void round3Status.refetch();
			},
		});
	const reset = api.cyber.team.resetEvent.useMutation({
		onSuccess: () => {
			setMessage("Competition data cleared. Team accounts were kept.");
			void utils.cyber.team.adminList.invalidate();
			void utils.cyber.round2.calculateRoundTwoScore.invalidate();
			void utils.cyber.round3.listSubmissions.invalidate();
			void round3Status.refetch();
		},
	});
	return (
		<div className="space-y-8">
			<section className="grid gap-4 sm:grid-cols-2">
				<article className="hud p-5">
					<h2 className="font-bold font-display text-[var(--cyan)] text-xl">
						Round 1
					</h2>
					<label className="mt-4 block text-sm">
						Timer length (minutes)
						<input
							className="input-neon mt-2"
							max={180}
							min={1}
							onChange={(e) => setMinutes(Number(e.target.value))}
							type="number"
							value={minutes}
						/>
					</label>
					<button
						className="btn-neon mt-3"
						onClick={() => start.mutate({ durationMinutes: minutes })}
						type="button"
					>
						Start timer
					</button>
					<button
						className="btn-neon btn-sm ml-2"
						onClick={() => advance.mutate()}
						type="button"
					>
						Advance everyone to Round 2
					</button>
				</article>
				<article className="hud p-5">
					<h2 className="font-bold font-display text-[var(--cyan)] text-xl">
						Round 2
					</h2>
					<label className="mt-4 block text-sm">
						Teams to advance
						<input
							className="input-neon mt-2"
							min={1}
							onChange={(e) => setCount(Number(e.target.value))}
							type="number"
							value={count}
						/>
					</label>
					<button
						className="btn-neon mt-3"
						onClick={() => shortlist.mutate({ topCountInt: count })}
						type="button"
					>
						Shortlist for Round 3
					</button>
				</article>
			</section>
			<section className="hud p-5">
				<h2 className="font-bold font-display text-[var(--cyan)] text-xl">
					Round 2 leaderboard
				</h2>
				<button
					className="btn-neon btn-sm my-3"
					onClick={() => void scores.refetch()}
					type="button"
				>
					Refresh scores
				</button>
				<ol>
					{scores.data?.map((t, i) => (
						<li className="border-white/10 border-t py-2" key={t.teamId}>
							{i + 1}. {t.name} — {t.score} points ({t.decrypted} solved)
						</li>
					))}
				</ol>
			</section>
			<section className="hud p-5">
				<h2 className="font-bold font-display text-[var(--cyan)] text-xl">
					Round 3 grading
				</h2>
				<ul className="mt-3 space-y-4">
					{submissions.data?.map((s) => (
						<li className="border-white/10 border-t pt-4" key={s.teamId}>
							<p className="font-semibold">
								{s.name} · {s.score ?? "ungraded"}
							</p>
							<ol className="my-2 list-inside list-decimal text-slate-400 text-sm">
								{answerLabels.map((label, i) => (
									<li key={label}>
										{label}: {s.answers[i]}
									</li>
								))}
							</ol>
							<form
								className="flex gap-2"
								onSubmit={(e) => {
									e.preventDefault();
									const fd = new FormData(e.currentTarget);
									grade.mutate({
										teamId: s.teamId,
										scoreInt: Number(fd.get("score")),
									});
								}}
							>
								<input
									className="input-neon w-28"
									defaultValue={s.score ?? 0}
									max={100}
									min={0}
									name="score"
									type="number"
								/>
								<button className="btn-neon btn-sm" type="submit">
									Save score
								</button>
							</form>
						</li>
					))}
				</ul>
				<button
					className="btn-neon btn-danger mt-5"
					onClick={() => finalists.mutate()}
					type="button"
				>
					Select top four finalists
				</button>
				<div className="mt-4 flex flex-wrap items-center gap-2 border-slate-800 border-t pt-4">
					<p className="mr-2 text-slate-400 text-sm">
						Submissions are {round3Status.data?.closed ? "closed" : "open"}.
					</p>
					<button
						className="btn-neon btn-sm disabled:opacity-50"
						disabled={
							setSubmissionsClosed.isPending || round3Status.data?.closed
						}
						onClick={() => setSubmissionsClosed.mutate({ closed: true })}
						type="button"
					>
						Close submissions
					</button>
					<button
						className="btn-neon btn-sm disabled:opacity-50"
						disabled={
							setSubmissionsClosed.isPending || !round3Status.data?.closed
						}
						onClick={() => setSubmissionsClosed.mutate({ closed: false })}
						type="button"
					>
						Reopen
					</button>
				</div>
			</section>
			<section className="hud p-5">
				<h2 className="font-bold font-display text-rose-300 text-xl">
					Danger zone
				</h2>
				<p className="mt-2 text-slate-400 text-sm">
					Clears all answers, hints, scores, matches, and timers. Team accounts
					remain, reset to Round 1, and keep their names.
				</p>
				<button
					className="btn-neon btn-danger mt-3 disabled:opacity-50"
					disabled={reset.isPending}
					onClick={() => {
						if (
							window.prompt("Type RESET to clear all competition data") ===
							"RESET"
						)
							reset.mutate({ confirm: "RESET" });
					}}
					type="button"
				>
					Reset event
				</button>
			</section>
			<section className="hud p-5">
				<h2 className="font-bold font-display text-[var(--cyan)] text-xl">
					Teams
				</h2>
				<ul className="mt-3 grid gap-2 sm:grid-cols-2">
					{teams.data?.map((t) => (
						<li className="border border-white/10 p-3" key={t.id}>
							{t.name} · Round {t.round} · {t.points} pts{" "}
							{t.eliminated && "· eliminated"}
						</li>
					))}
				</ul>
			</section>
			{message && (
				<p className="text-emerald-300" role="status">
					{message}
				</p>
			)}
		</div>
	);
}
