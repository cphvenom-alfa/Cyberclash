"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/trpc/react";

export default function QuestionsAdminPage() {
	const utils = api.useUtils();
	const questions = api.cyber.content.listQuestions.useQuery();
	const [prompt, setPrompt] = useState("");
	const [answer, setAnswer] = useState("");
	const [points, setPoints] = useState(1);
	const [bulk, setBulk] = useState("");
	const [notice, setNotice] = useState("");
	const refresh = async (message: string) => {
		setNotice(message);
		await utils.cyber.content.listQuestions.invalidate();
	};
	const create = api.cyber.content.createQuestion.useMutation({
		onSuccess: async () => {
			await refresh("Question added.");
			setPrompt("");
			setAnswer("");
			setPoints(1);
		},
	});
	const bulkCreate = api.cyber.content.bulkCreateQuestions.useMutation({
		onSuccess: async (result) => {
			await refresh(
				`Added ${result.created} question(s).${result.errors.length ? ` Issues: ${result.errors.join("; ")}` : ""}`,
			);
			if (!result.errors.length) setBulk("");
		},
	});
	const update = api.cyber.content.updateQuestion.useMutation({
		onSuccess: () => refresh("Question updated."),
	});
	const remove = api.cyber.content.deleteQuestion.useMutation({
		onSuccess: () => refresh("Question deleted."),
	});
	const error =
		create.error?.message ??
		bulkCreate.error?.message ??
		update.error?.message ??
		remove.error?.message;

	return (
		<main className="mx-auto min-h-screen max-w-5xl space-y-6 px-6 py-12 text-[var(--ink)]">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="font-mono text-[var(--cyan)] text-xs tracking-widest">
						ORGANIZER CONSOLE
					</p>
					<h1 className="title-glow mt-2 font-display text-4xl">
						Round 1 questions
					</h1>
				</div>
				<Link className="btn-ghost" href="/admin">
					Back to competition control
				</Link>
			</header>
			{notice && (
				<p className="hud p-3 text-emerald-300" role="status">
					{notice}
				</p>
			)}
			{error && (
				<p className="hud p-3 text-rose-300" role="alert">
					{error}
				</p>
			)}
			<section className="hud space-y-4 p-5">
				<h2 className="font-display text-[var(--cyan)] text-xl">
					Add a question
				</h2>
				<p className="text-[var(--dim)] text-sm">
					Use | between accepted answers, for example{" "}
					<code>keyboard|a keyboard</code>.
				</p>
				<form
					className="grid gap-3"
					onSubmit={(event) => {
						event.preventDefault();
						create.mutate({ prompt, answer, points });
					}}
				>
					<label className="grid gap-1 text-sm">
						Question
						<textarea
							className="input-neon"
							maxLength={1000}
							minLength={3}
							onChange={(event) => setPrompt(event.target.value)}
							required
							rows={3}
							value={prompt}
						/>
					</label>
					<label className="grid gap-1 text-sm">
						Accepted answer(s)
						<input
							className="input-neon"
							maxLength={300}
							onChange={(event) => setAnswer(event.target.value)}
							required
							value={answer}
						/>
					</label>
					<label className="grid w-32 gap-1 text-sm">
						Points
						<input
							className="input-neon"
							max={100}
							min={1}
							onChange={(event) => setPoints(Number(event.target.value))}
							type="number"
							value={points}
						/>
					</label>
					<div>
						<button
							className="btn-neon"
							disabled={create.isPending}
							type="submit"
						>
							Add question
						</button>
					</div>
				</form>
			</section>
			<section className="hud space-y-4 p-5">
				<h2 className="font-display text-[var(--cyan)] text-xl">Bulk import</h2>
				<p className="text-[var(--dim)] text-sm">
					One per line: question =&gt; answer1|answer2 =&gt; points (optional,
					defaults to 1).
				</p>
				<textarea
					className="input-neon font-mono text-sm"
					onChange={(event) => setBulk(event.target.value)}
					rows={6}
					value={bulk}
				/>
				<button
					className="btn-neon"
					disabled={!bulk.trim() || bulkCreate.isPending}
					onClick={() => bulkCreate.mutate({ text: bulk })}
					type="button"
				>
					Import questions
				</button>
			</section>
			<section className="hud space-y-4 p-5">
				<h2 className="font-display text-[var(--cyan)] text-xl">
					All questions ({questions.data?.length ?? 0})
				</h2>
				{questions.isLoading && (
					<p className="text-[var(--dim)]">Loading questions…</p>
				)}
				<div className="space-y-3">
					{questions.data?.map((question, index) => (
						<article
							className="border-white/10 border-t pt-4"
							key={question.id}
						>
							<p className="font-semibold">
								{index + 1}. {question.prompt}
							</p>
							<p className="mt-1 font-mono text-[var(--dim)] text-sm">
								Answer: {question.answer} · {question.points} pt ·{" "}
								{question.submissions} submission(s)
							</p>
							<div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_6rem_auto_auto]">
								<input
									aria-label="Question"
									className="input-neon"
									defaultValue={question.prompt}
									id={`prompt-${question.id}`}
								/>
								<input
									aria-label="Accepted answers"
									className="input-neon"
									defaultValue={question.answer}
									id={`answer-${question.id}`}
								/>
								<input
									aria-label="Points"
									className="input-neon"
									defaultValue={question.points}
									id={`points-${question.id}`}
									max={100}
									min={1}
									type="number"
								/>
								<button
									className="btn-ghost"
									onClick={() => {
										const promptInput = document.getElementById(
											`prompt-${question.id}`,
										) as HTMLInputElement;
										const answerInput = document.getElementById(
											`answer-${question.id}`,
										) as HTMLInputElement;
										const pointsInput = document.getElementById(
											`points-${question.id}`,
										) as HTMLInputElement;
										update.mutate({
											id: question.id,
											prompt: promptInput.value,
											answer: answerInput.value,
											points: Number(pointsInput.value),
										});
									}}
									type="button"
								>
									Save edits
								</button>
								<button
									className="btn-ghost"
									disabled={question.submissions > 0 || remove.isPending}
									onClick={() => {
										if (window.confirm("Delete this question?"))
											remove.mutate({ id: question.id });
									}}
									title={
										question.submissions
											? "Questions with submissions cannot be deleted"
											: undefined
									}
									type="button"
								>
									Delete
								</button>
							</div>
						</article>
					))}
				</div>
				{questions.data?.length === 0 && (
					<p className="text-[var(--dim)]">No questions yet. Add one above.</p>
				)}
			</section>
		</main>
	);
}
