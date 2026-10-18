// File: src/app/play/round-3/page.tsx
"use client";
import { useState } from "react";
import { api } from "@/trpc/react";

const KIND_LABEL: Record<string, string> = { character: "Characters", conversation: "Conversations", email: "Emails", log: "Access logs" };

export default function Round3() {
  const ev = api.cyber.round3.renderDigitalEvidence.useQuery();
  const qs = api.cyber.round3.questions.useQuery();
  const status = api.cyber.round3.status.useQuery(undefined, { refetchInterval: 10_000 });
  const submit = api.cyber.round3.submitInvestigationAnswers.useMutation();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const questions = qs.data ?? [];
  const closed = status.data?.closed ?? false;
  const complete = questions.length > 0 && questions.every((q) => answers[q.id]?.trim());

  const groups = Object.entries(
    (ev.data?.evidence ?? []).reduce<Record<string, NonNullable<typeof ev.data>["evidence"]>>((acc, e) => { (acc[e.kind] ??= []).push(e); return acc; }, {}),
  );
  if (ev.error) return <main className="p-6 text-rose-400">{ev.error.message}</main>;

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-2">
      <div className="space-y-4">
        <h1 className="font-display title-glow text-2xl font-black tracking-wide">Blackbox Investigation</h1>
        <section className="hud p-4">
          <h2 className="mb-2 font-semibold text-[var(--gold)]">Your decrypted clues</h2>
          {ev.data?.decodedMessages.length ? (
            <ul className="list-disc space-y-1 pl-5 font-mono text-sm">{ev.data.decodedMessages.map((m) => <li key={m.id}>{m.plaintext}</li>)}</ul>
          ) : <p className="text-sm text-[var(--dim)]">You decoded no messages in Round 2.</p>}
        </section>
        {groups.length === 0 && <p className="text-sm text-[var(--dim)]">The case file has not been published yet.</p>}
        {groups.map(([kind, items]) => (
          <section key={kind} className="space-y-2">
            <h2 className="text-sm uppercase tracking-widest text-[var(--dim)]">{KIND_LABEL[kind] ?? kind}</h2>
            {items.map((e) => (
              <details key={e.id} className="hud p-3">
                <summary className="cursor-pointer font-semibold">{e.title}</summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-sm text-[var(--dim)]">{e.body}</pre>
              </details>
            ))}
          </section>
        ))}
      </div>

      <div className="space-y-3 lg:sticky lg:top-6 lg:self-start">
        <h2 className="font-bold">Your conclusions</h2>
        <p className="text-xs text-[var(--dim)]">Explain your reasoning. Answers are graded on logic, not just the final guess. You can resubmit until the organizers close this round.</p>
        {closed && <p className="hud p-2 text-[var(--gold)]">Submissions are closed. Your last submitted answers are being graded.</p>}
        {qs.isSuccess && questions.length === 0 && <p className="hud p-3 text-[var(--gold)]">The organizers have not published the questions yet.</p>}
        {questions.map((q, i) => (
          <label key={q.id} className="block space-y-1 text-sm">
            <span className="text-[var(--cyan)]">{i + 1}. {q.prompt}</span>
            <textarea rows={3} className="input-neon" value={answers[q.id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} />
          </label>
        ))}
        <button className="btn-neon w-full" disabled={closed || submit.isPending || !complete} onClick={() => submit.mutate({ answersPayload: questions.map((q) => answers[q.id] ?? "") })}>
          {submit.isPending ? "Submitting…" : `Submit all ${questions.length} answers`}
        </button>
        {submit.isSuccess && <p className="text-[var(--cyan)]">✔ Submitted</p>}
        {submit.error && <p role="alert" className="text-rose-400">{submit.error.message}</p>}
      </div>
    </main>
  );
}
