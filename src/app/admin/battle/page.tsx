// File: src/app/admin/battle/page.tsx
"use client";
import { useState } from "react";
import { api } from "@/trpc/react";

const input = "input-neon text-sm";
const btn = "btn-neon btn-sm";

export default function AdminBattle() {
  const finalists = api.cyber.final.finalists.useQuery();
  const [matchId, setMatchId] = useState("");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [stage, setStage] = useState<"semi" | "final">("semi");
  const [dur, setDur] = useState(90);
  const [sentence, setSentence] = useState("");
  const [cipher, setCipher] = useState("caesar");
  const [msg, setMsg] = useState("");

  const view = api.cyber.final.adminMatchView.useQuery({ matchId }, { enabled: matchId.length === 36, refetchInterval: 2000 });
  const done = (t: string) => ({ onSuccess: () => { setMsg(t); void view.refetch(); }, onError: (e: { message: string }) => setMsg(e.message) });

  const create = api.cyber.final.createMatch.useMutation({ onSuccess: (r) => { if (r) { setMatchId(r.id); setMsg("Match created"); } } });
  const assign = api.cyber.final.assignSentenceAndCipher.useMutation(done("Assigned"));
  const approve = api.cyber.final.approveEncryptedChallenge.useMutation(done("Updated"));
  const start = api.cyber.final.startBattleTimer.useMutation(done("Timer started"));
  const winner = api.cyber.final.calculateBattleWinner.useMutation(done("Calculated"));
  const sudden = api.cyber.final.triggerSuddenDeath.useMutation(done("Sudden death armed — assign new sentences"));

  const name = (id: string) => finalists.data?.find((t) => t.id === id)?.name ?? id.slice(0, 6);
  const m = view.data?.match;

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Battle control</h1>
      {msg && <p className="hud p-2 text-sm">{msg}</p>}

      <section className="space-y-2 hud p-4">
        <h2 className="font-bold text-[var(--cyan)]">1 · Create match</h2>
        <div className="flex flex-wrap gap-2">
          <select className={input} value={stage} onChange={(e) => setStage(e.target.value as "semi" | "final")}><option value="semi">semi</option><option value="final">final</option></select>
          {[[a, setA], [b, setB]].map(([v, set], i) => (
            <select key={i} className={input} value={v as string} onChange={(e) => (set as (s: string) => void)(e.target.value)}>
              <option value="">Team {i ? "B" : "A"}</option>
              {finalists.data?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          ))}
          <button className={btn} disabled={!a || !b || a === b} onClick={() => create.mutate({ stage, teamAId: a, teamBId: b })}>Create</button>
        </div>
        <input className={`${input} w-full font-mono`} placeholder="…or paste an existing match id" value={matchId} onChange={(e) => setMatchId(e.target.value)} />
        {matchId.length === 36 && <a className="text-sm text-[var(--gold)] underline" href={`/projector/${matchId}`} target="_blank">Open projector view ↗</a>}
      </section>

      {m && (
        <>
          <section className="space-y-2 hud p-4">
            <h2 className="font-bold text-[var(--cyan)]">2 · Assign sentence + cipher (same for both for fairness, or differ)</h2>
            <div className="flex flex-wrap gap-2">
              <input className={`${input} flex-1`} placeholder="Organizer-approved sentence" value={sentence} onChange={(e) => setSentence(e.target.value)} />
              <select className={input} value={cipher} onChange={(e) => setCipher(e.target.value)}>
                {["reverse", "atbash", "a1z26", "morse", "binary", "hex", "base64", "polybius", "caesar", "substitution", "vigenere", "railfence"].map((c) => <option key={c}>{c}</option>)}
              </select>
              {[m.teamAId, m.teamBId].map((id) => (
                <button key={id} className={btn} disabled={!sentence.trim()} onClick={() => assign.mutate({ matchId, teamId: id, sentenceString: sentence, cipherType: cipher })}>
                  → {name(id)}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2 hud p-4">
            <h2 className="font-bold text-[var(--cyan)]">3 · Approve encrypted messages</h2>
            {view.data?.challenges.map((c) => (
              <div key={c.id} className="space-y-1 border-t border-slate-800 pt-2 text-sm">
                <p><b>{name(c.teamId)}</b> · {c.cipherType} · plaintext: <span className="font-mono text-[var(--gold)]">{c.sentence}</span></p>
                <p>Submitted: <span className="font-mono text-emerald-300">{c.encrypted ?? "— not yet —"}</span> {c.approved && "✔ approved"}</p>
                <div className="flex gap-2">
                  <button className={btn} disabled={!c.encrypted} onClick={() => approve.mutate({ matchId, teamId: c.teamId, isApprovedBool: true })}>Approve</button>
                  <button className="btn-neon btn-sm btn-danger" disabled={!c.encrypted} onClick={() => approve.mutate({ matchId, teamId: c.teamId, isApprovedBool: false })}>Reject</button>
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-2 hud p-4">
            <h2 className="font-bold text-[var(--cyan)]">4 · Run the duel</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input type="number" className={`${input} w-24`} value={dur} onChange={(e) => setDur(+e.target.value)} /> sec
              <button className={btn} onClick={() => start.mutate({ matchId, durationSeconds: dur })}>Start timer</button>
              <button className={btn} onClick={() => winner.mutate({ matchId })}>Calculate winner</button>
              <button className="btn-neon btn-sm btn-gold" onClick={() => sudden.mutate({ matchId })}>Sudden death</button>
            </div>
            {winner.data && <p className="text-lg">{winner.data.tie ? `Tie (${winner.data.reason}) — trigger sudden death` : `🏆 Winner: ${name(winner.data.winnerId!)}`}</p>}
            <ul className="text-sm text-slate-300">
              {view.data?.submissions.map((s) => (
                <li key={s.id}>{name(s.teamId)}: {s.correct ? "✔" : "✘"} “{s.answer}” at {s.submittedAt.toISOString().slice(11, 23)}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
