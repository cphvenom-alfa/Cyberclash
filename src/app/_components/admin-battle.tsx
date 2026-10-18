"use client";
import { useState } from "react";
import { api } from "@/trpc/react";

export function AdminBattle() {
	const utils = api.useUtils();
	const finalists = api.cyber.final.finalists.useQuery();
	const matches = api.cyber.final.adminMatches.useQuery();
	const teamName = (teamId: string) =>
		finalists.data?.find((team) => team.id === teamId)?.name ?? teamId;
	const [a, setA] = useState("");
	const [b, setB] = useState("");
	const [matchId, setMatchId] = useState("");
	const create = api.cyber.final.createMatch.useMutation({
		onSuccess: async (m) => {
			if (m) {
				setMatchId(m.id);
				await utils.cyber.final.adminMatches.invalidate();
			}
		},
	});
	const view = api.cyber.final.adminMatchView.useQuery(
		{ matchId: matchId || "00000000-0000-0000-0000-000000000000" },
		{ enabled: !!matchId, refetchInterval: 5000 },
	);
	const assign = api.cyber.final.assignSentenceAndCipher.useMutation({
		onSuccess: () => void view.refetch(),
	});
	const approve = api.cyber.final.approveEncryptedChallenge.useMutation({
		onSuccess: () => void view.refetch(),
	});
	const start = api.cyber.final.startBattleTimer.useMutation();
	const winner = api.cyber.final.calculateBattleWinner.useMutation();
	const sudden = api.cyber.final.triggerSuddenDeath.useMutation({
		onSuccess: () => void view.refetch(),
	});
	const [stage, setStage] = useState<"semi" | "final">("semi");
	const [duration, setDuration] = useState(90);
	return (
		<div className="space-y-6">
			<section className="hud p-5">
				<h2 className="font-bold font-display text-[var(--cyan)] text-xl">
					Create match
				</h2>
				<div className="mt-4 grid gap-3 sm:grid-cols-3">
					<select
						className="input-neon"
						onChange={(e) => setStage(e.target.value as "semi" | "final")}
						value={stage}
					>
						<option value="semi">Semifinal</option>
						<option value="final">Final</option>
					</select>
					<select
						className="input-neon"
						onChange={(e) => setA(e.target.value)}
						value={a}
					>
						<option value="">Team A</option>
						{finalists.data?.map((t) => (
							<option key={t.id} value={t.id}>
								{t.name}
							</option>
						))}
					</select>
					<select
						className="input-neon"
						onChange={(e) => setB(e.target.value)}
						value={b}
					>
						<option value="">Team B</option>
						{finalists.data?.map((t) => (
							<option key={t.id} value={t.id}>
								{t.name}
							</option>
						))}
					</select>
				</div>
				<button
					className="btn-neon mt-4"
					disabled={!a || !b || a === b}
					onClick={() => create.mutate({ stage, teamAId: a, teamBId: b })}
					type="button"
				>
					Create match
				</button>
			</section>
			<section className="hud p-5">
				<h2 className="font-bold font-display text-[var(--cyan)] text-xl">
					Match operations
				</h2>
				<select
					className="input-neon mt-4"
					onChange={(e) => setMatchId(e.target.value)}
					value={matchId}
				>
					<option value="">Select a match</option>
					{matches.data?.map((m) => (
						<option key={m.id} value={m.id}>
							{m.stage} · {m.id.slice(0, 8)} · attempt {m.suddenDeath}
						</option>
					))}
				</select>
				{view.data && (
					<>
						<ul className="mt-4 space-y-4">
							{view.data.challenges.map((c) => (
								<li className="rounded-xl bg-slate-800 p-4" key={c.id}>
									<p className="font-semibold">
										{c.teamId} · {c.cipherType}
									</p>
									<p className="mt-1">Sentence: {c.sentence}</p>
									<p className="mt-1 break-all font-mono text-cyan-200">
										Ciphertext: {c.encrypted ?? "awaiting team"}
									</p>
									<p className="mt-1 text-sm">
										{c.approved ? "Approved" : "Not approved"}
									</p>
									<button
										className="mt-2 rounded bg-indigo-400 px-3 py-2 font-bold text-slate-950 text-sm"
										disabled={!c.encrypted}
										onClick={() =>
											approve.mutate({
												matchId,
												teamId: c.teamId,
												isApprovedBool: !c.approved,
											})
										}
										type="button"
									>
										{c.approved ? "Revoke approval" : "Approve challenge"}
									</button>
								</li>
							))}
						</ul>
						<h3 className="mt-5 font-bold">
							Assign challenges for this attempt
						</h3>
						{[view.data.match.teamAId, view.data.match.teamBId].map(
							(teamId) => (
								<form
									className="mt-3 grid gap-2 rounded-xl border border-slate-700 p-3 sm:grid-cols-3"
									key={teamId}
									onSubmit={(e) => {
										e.preventDefault();
										const f = new FormData(e.currentTarget);
										assign.mutate({
											matchId,
											teamId,
											sentenceString: String(f.get("sentence")),
											cipherType: String(f.get("cipher")),
										});
									}}
								>
									<span className="self-center text-xs">{teamId}</span>
									<input
										className="rounded bg-slate-800 px-3 py-2"
										name="sentence"
										placeholder="Challenge sentence"
										required
									/>
									<div className="flex gap-2">
										<select
											className="min-w-0 flex-1 rounded bg-slate-800 px-2"
											name="cipher"
										>
											<option>caesar</option>
											<option>morse</option>
											<option>binary</option>
										</select>
										<button className="rounded bg-slate-700 px-3" type="submit">
											Assign
										</button>
									</div>
								</form>
							),
						)}
						<div className="mt-5 flex flex-wrap items-end gap-3">
							<label className="text-sm">
								Timer seconds
								<input
									className="mt-1 block w-28 rounded bg-slate-800 p-2"
									max={600}
									min={10}
									onChange={(e) => setDuration(Number(e.target.value))}
									type="number"
									value={duration}
								/>
							</label>
							<button
								className="rounded bg-cyan-300 px-4 py-2 font-bold text-slate-950"
								onClick={() =>
									start.mutate({ matchId, durationSeconds: duration })
								}
								type="button"
							>
								Start timer
							</button>
							<button
								className="rounded bg-emerald-400 px-4 py-2 font-bold text-slate-950"
								onClick={() => winner.mutate({ matchId })}
								type="button"
							>
								Calculate winner
							</button>
							<button
								className="rounded bg-rose-400 px-4 py-2 font-bold text-slate-950"
								onClick={() => sudden.mutate({ matchId })}
								type="button"
							>
								Trigger sudden death
							</button>
						</div>
						<h3 className="mt-6 font-bold">Submissions</h3>
						{view.data.submissions.map((s) => (
							<p className="mt-2 text-sm" key={s.id}>
								{s.teamId}: {s.answer} · {s.correct ? "correct" : "incorrect"}
							</p>
						))}
						{winner.data && (
							<p className="mt-4 text-emerald-300 text-lg">
								{winner.data.tie
									? `Tie (${winner.data.reason}) — trigger sudden death.`
									: `Winner: ${teamName(winner.data.winnerId ?? "")}`}
							</p>
						)}
					</>
				)}
				{(create.error ||
					assign.error ||
					approve.error ||
					start.error ||
					winner.error ||
					sudden.error) && (
					<p className="mt-4 text-rose-300" role="alert">
						{create.error?.message ||
							assign.error?.message ||
							approve.error?.message ||
							start.error?.message ||
							winner.error?.message ||
							sudden.error?.message}
					</p>
				)}
			</section>
		</div>
	);
}
