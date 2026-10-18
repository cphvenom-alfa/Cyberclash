"use client";

import { useEffect, useState } from "react";
import { api } from "@/trpc/react";

const questions = [
	"Who is the cybercriminal?",
	"When did the attack take place?",
	"How did the attacker enter?",
	"Question 4",
	"Question 5",
	"Question 6",
	"Question 7",
];
const evidenceKinds = [
	["character", "Characters"],
	["conversation", "Conversations"],
	["email", "Emails"],
	["log", "Access logs"],
] as const;

export function RoundThree() {
	const utils = api.useUtils();
	const evidence = api.cyber.round3.renderDigitalEvidence.useQuery();
	const submission = api.cyber.round3.myInvestigation.useQuery();
	const status = api.cyber.round3.status.useQuery(undefined, {
		refetchInterval: 10_000,
	});
	const closed = status.data?.closed ?? false;
	const [answers, setAnswers] = useState<string[]>(Array(7).fill(""));
	const save = api.cyber.round3.submitInvestigationAnswers.useMutation({
		onSuccess: () => void utils.cyber.round3.myInvestigation.invalidate(),
	});
	useEffect(() => {
		if (submission.data?.answers) setAnswers(submission.data.answers);
	}, [submission.data]);

	if (evidence.error)
		return (
			<p className="text-rose-300" role="alert">
				{evidence.error.message}
			</p>
		);

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<section className="space-y-4">
				<h1 className="title-glow font-bold font-display text-2xl text-[var(--cyan)]">
					Round 3 · Blackbox Investigation
				</h1>
				<article className="hud p-4">
					<h2 className="mb-2 font-semibold text-[var(--gold)]">
						Your decrypted clues
					</h2>
					{evidence.data?.decodedMessages.length ? (
						<ul className="list-disc space-y-1 pl-5 font-mono text-sm">
							{evidence.data.decodedMessages.map((message) => (
								<li key={message.id}>{message.plaintext}</li>
							))}
						</ul>
					) : (
						<p className="text-slate-400 text-sm">
							No messages were decoded in Round 2.
						</p>
					)}
				</article>
				{evidenceKinds.map(([kind, label]) => {
					const entries =
						evidence.data?.evidence.filter((item) => item.kind === kind) ?? [];
					if (!entries.length) return null;
					return (
						<section className="space-y-2" key={kind}>
							<h2 className="text-slate-400 text-sm uppercase tracking-widest">
								{label}
							</h2>
							{entries.map((item) => (
								<details className="hud p-3" key={item.id}>
									<summary className="cursor-pointer font-semibold">
										{item.title}
									</summary>
									<pre className="mt-2 whitespace-pre-wrap font-mono text-[var(--dim)] text-sm">
										{item.body}
									</pre>
								</details>
							))}
						</section>
					);
				})}
			</section>
			<form
				className="space-y-3 lg:sticky lg:top-6 lg:self-start"
				onSubmit={(event) => {
					event.preventDefault();
					save.mutate({ answersPayload: answers });
				}}
			>
				<h2 className="font-bold">Your conclusions</h2>
				{closed && (
					<p className="hud p-2 text-[var(--gold)]">
						Submissions are closed. Your last submitted answers are being
						graded.
					</p>
				)}
				<p className="text-slate-400 text-xs">
					Explain your reasoning. Answers are graded on logic, not only the
					final guess. You can resubmit until organizers close this round.
				</p>
				{questions.map((question, index) => (
					<label className="block space-y-1 text-sm" key={question}>
						<span className="text-[var(--cyan)]">
							{index + 1}. {question}
						</span>
						<textarea
							className="input-neon"
							disabled={closed}
							maxLength={2000}
							onChange={(event) =>
								setAnswers((previous) =>
									previous.map((answer, i) =>
										i === index ? event.target.value : answer,
									),
								)
							}
							rows={3}
							value={answers[index] ?? ""}
						/>
					</label>
				))}
				<button
					className="btn-neon w-full"
					disabled={
						closed || save.isPending || answers.some((answer) => !answer.trim())
					}
					type="submit"
				>
					{save.isPending ? "Submitting…" : "Submit all 7 answers"}
				</button>
				{save.isSuccess && <p className="text-emerald-300">Answers saved.</p>}
				{save.error && (
					<p className="text-rose-300" role="alert">
						{save.error.message}
					</p>
				)}
			</form>
		</div>
	);
}
