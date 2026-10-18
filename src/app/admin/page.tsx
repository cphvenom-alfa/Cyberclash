// File: src/app/admin/page.tsx
"use client";
import { Minus, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Countdown, useCountdown } from "@/app/_components/countdown";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/trpc/react";

/** Number control: [-] [ value unit ] [+] with optional presets. Text input, so no browser spinner arrows. */
function Stepper({ id, value, onChange, min, max, suffix, presets }: { id: string; value: number; onChange: (n: number) => void; min: number; max: number; suffix: string; presets?: number[] }) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)));
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon" aria-label="Decrease" disabled={value <= min} onClick={() => onChange(clamp(value - 1))}><Minus className="h-4 w-4" /></Button>
        <div className="relative flex-1">
          <Input id={id} inputMode="numeric" className="pr-16 text-center tabular-nums" value={text}
            onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); setText(d); if (d) onChange(clamp(Number(d))); }}
            onBlur={() => setText(String(value))} />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">{suffix}</span>
        </div>
        <Button type="button" variant="outline" size="icon" aria-label="Increase" disabled={value >= max} onClick={() => onChange(clamp(value + 1))}><Plus className="h-4 w-4" /></Button>
      </div>
      {presets && <div className="flex flex-wrap gap-2">{presets.map((p) => <Button key={p} type="button" size="sm" variant={value === p ? "default" : "outline"} onClick={() => onChange(p)}>{p} {suffix}</Button>)}</div>}
    </div>
  );
}

function Confirm({ trigger, title, description, confirmLabel, onConfirm, destructive }: { trigger: React.ReactNode; title: string; description: React.ReactNode; confirmLabel: string; onConfirm: () => void; destructive?: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={trigger as React.ReactElement} />
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={destructive ? buttonVariants({ variant: "destructive" }) : undefined}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium">{children}</span></div>
);

export default function Admin() {
  const utils = api.useUtils();
  const clock = api.cyber.round1.state.useQuery(undefined, { refetchInterval: 5000 });
  const questions = api.cyber.content.listQuestions.useQuery();
  const scores = api.cyber.round2.calculateRoundTwoScore.useQuery(undefined, { refetchInterval: 10_000 });
  const subs = api.cyber.round3.listSubmissions.useQuery(undefined, { refetchInterval: 10_000 });
  const r3 = api.cyber.round3.status.useQuery();
  const r3q = api.cyber.round3.questions.useQuery();

  const [minutes, setMinutes] = useState(30);
  const [topN, setTopN] = useState(8);
  const [pts, setPts] = useState<Record<string, string>>({});
  const [resetText, setResetText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const ok = (text: string) => setMsg({ ok: true, text });
  const bad = (e: { message: string }) => setMsg({ ok: false, text: e.message });
  const refresh = () => void utils.invalidate();

  const start = api.cyber.round1.startRoundOneTimer.useMutation({ onSuccess: () => { ok(`Round 1 started for ${minutes} minutes`); refresh(); }, onError: bad });
  const advance = api.cyber.round1.advanceAllTeamsToRoundTwo.useMutation({ onSuccess: () => { ok("All teams moved to Round 2"); refresh(); }, onError: bad });
  const shortlist3 = api.cyber.round2.shortlistTeamsForRoundThree.useMutation({ onSuccess: (r) => { ok(`${r.advanced.length} team(s) advanced to Round 3`); refresh(); }, onError: bad });
  const grade = api.cyber.round3.submitAdminScore.useMutation({ onSuccess: () => { ok("Score saved"); refresh(); }, onError: bad });
  const setClosed = api.cyber.round3.setSubmissionsClosed.useMutation({ onSuccess: (r) => { ok(r.closed ? "Round 3 submissions closed" : "Round 3 submissions reopened"); refresh(); }, onError: bad });
  const top4 = api.cyber.round3.shortlistTopFourForFinal.useMutation({ onSuccess: () => { ok("Top 4 teams are in the final"); refresh(); }, onError: bad });
  const reset = api.cyber.team.resetEvent.useMutation({ onSuccess: () => { ok("Event reset"); setResetText(""); refresh(); }, onError: bad });

  const left = useCountdown(clock.data?.endsAt, clock.data?.now);
  const phase = left === null ? "Not started" : left > 0 ? "Running" : "Ended";
  const qCount = questions.data?.length ?? 0;
  const teamCount = scores.data?.length ?? 0;
  const advanceN = Math.min(topN, Math.max(teamCount, 1));

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <p className="text-sm text-muted-foreground">Organizer console</p>
        <h1 className="display text-4xl">Competition control</h1>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4" aria-label="Overview">
        {[["Teams", teamCount], ["Round 1 questions", qCount], ["Round 1 timer", phase], ["Round 3 submissions", r3.data?.closed ? "Closed" : "Open"]].map(([l, v]) => (
          <Card key={l as string}><CardContent className="p-5"><p className="text-xs uppercase tracking-wider text-muted-foreground">{l}</p><p className="display mt-1 text-3xl">{v}</p></CardContent></Card>
        ))}
      </section>

      {msg && <p role="status" className={`rounded-md border px-4 py-2 text-sm ${msg.ok ? "border-emerald-500/40 text-emerald-300" : "border-destructive/60 text-rose-300"}`}>{msg.text}</p>}

      <Tabs defaultValue="round1" className="space-y-6">
        <TabsList><TabsTrigger value="round1">Round 1</TabsTrigger><TabsTrigger value="round2">Round 2</TabsTrigger><TabsTrigger value="round3">Round 3</TabsTrigger><TabsTrigger value="danger">Danger zone</TabsTrigger></TabsList>

        <TabsContent value="round1" className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Start the quiz</CardTitle><CardDescription>Teams see the countdown the moment you start.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2"><Label htmlFor="mins">Timer length</Label><Stepper id="mins" value={minutes} onChange={setMinutes} min={1} max={180} suffix="min" presets={[15, 30, 45, 60]} /></div>
              {qCount === 0 && <p className="text-sm text-[var(--gold)]">No questions yet. <Link href="/admin/questions" className="underline">Add questions first</Link>.</p>}
              <Confirm trigger={<Button className="w-full" disabled={qCount === 0 || start.isPending || phase === "Running"}>{start.isPending ? "Starting…" : "Start timer"}</Button>}
                title="Start Round 1?" description={`Teams will have ${minutes} minutes to answer ${qCount} question(s). This starts immediately.`} confirmLabel="Start now" onConfirm={() => start.mutate({ durationMinutes: minutes })} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Round status</CardTitle><CardDescription>Move teams on once the timer has ended.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Row label="Timer"><Badge variant={phase === "Running" ? "default" : "secondary"}>{phase}</Badge></Row>
                <Row label="Time left">{phase === "Running" && clock.data ? <Countdown endsAt={clock.data.endsAt} serverNow={clock.data.now} /> : "—"}</Row>
                <Row label="Questions">{qCount}</Row>
              </div>
              <Confirm trigger={<Button variant="outline" className="w-full" disabled={phase !== "Ended" || advance.isPending}>Advance everyone to Round 2</Button>}
                title="Advance all teams?" description="Every team moves to Round 2. Nobody is eliminated." confirmLabel="Advance" onConfirm={() => advance.mutate()} />
              {phase !== "Ended" && <p className="text-xs text-muted-foreground">Available when the timer has ended.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="round2" className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1.5"><CardTitle>Round 2 leaderboard</CardTitle><CardDescription>Score = decrypted messages plus points left. Updates every 10 seconds.</CardDescription></div>
              <Button variant="outline" size="sm" onClick={() => void scores.refetch()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead className="w-12">Rank</TableHead><TableHead>Team</TableHead><TableHead className="text-right">Decrypted</TableHead><TableHead className="text-right">Points left</TableHead><TableHead className="text-right">Score</TableHead></TableRow></TableHeader>
                <TableBody>
                  {scores.data?.map((r, i) => (
                    <TableRow key={r.teamId}><TableCell>{i + 1}</TableCell><TableCell className="font-medium">{r.name}</TableCell><TableCell className="text-right tabular-nums">{r.decrypted}</TableCell><TableCell className="text-right tabular-nums">{r.retained}</TableCell><TableCell className="text-right font-semibold tabular-nums">{r.score}</TableCell></TableRow>
                  ))}
                  {teamCount === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No teams yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="max-w-md">
            <CardHeader><CardTitle>Advance to Round 3</CardTitle><CardDescription>The top teams by score continue. Everyone else is eliminated.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2"><Label htmlFor="topn">Teams to advance</Label><Stepper id="topn" value={advanceN} onChange={setTopN} min={1} max={Math.max(teamCount, 1)} suffix="teams" /></div>
              <Confirm trigger={<Button className="w-full" disabled={teamCount === 0 || shortlist3.isPending}>Advance top {advanceN}</Button>}
                title={`Advance the top ${advanceN}?`} description={`${advanceN} team(s) go to Round 3 and ${Math.max(teamCount - advanceN, 0)} are eliminated. This cannot be undone.`} confirmLabel="Advance" destructive onConfirm={() => shortlist3.mutate({ topCountInt: advanceN })} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="round3" className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1.5"><CardTitle>Investigation answers</CardTitle><CardDescription>Score each team 0 to 100 on its reasoning, not just the final guess.</CardDescription></div>
              <Button variant="outline" size="sm" disabled={setClosed.isPending} onClick={() => setClosed.mutate({ closed: !r3.data?.closed })}>{r3.data?.closed ? "Reopen submissions" : "Close submissions"}</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {subs.data?.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No submissions yet.</p>}
              {subs.data?.map((s) => (
                <div key={s.teamId} className="space-y-3 rounded-md border border-border p-4">
                  <div className="flex items-center justify-between gap-3"><p className="font-medium">{s.name}</p><Badge variant={s.score === null ? "secondary" : "default"}>{s.score === null ? "Ungraded" : `Score ${s.score}`}</Badge></div>
                  <ol className="list-decimal space-y-2 pl-5 text-sm">{s.answers.map((a, i) => <li key={i}><span className="text-muted-foreground">{r3q.data?.[i]?.prompt}</span><br />{a}</li>)}</ol>
                  <div className="flex items-center gap-2">
                    <Input inputMode="numeric" className="w-24 text-center tabular-nums" placeholder="0–100" value={pts[s.teamId] ?? ""} onChange={(e) => setPts((p) => ({ ...p, [s.teamId]: e.target.value.replace(/\D/g, "").slice(0, 3) }))} />
                    <Button size="sm" variant="outline" disabled={grade.isPending || !pts[s.teamId] || Number(pts[s.teamId]) > 100} onClick={() => grade.mutate({ teamId: s.teamId, scoreInt: Number(pts[s.teamId]) })}>Save score</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="max-w-md">
            <CardHeader><CardTitle>Pick the finalists</CardTitle><CardDescription>The 4 highest scores go to the final. All 4 need a score first.</CardDescription></CardHeader>
            <CardContent>
              <Confirm trigger={<Button className="w-full" disabled={top4.isPending}>Shortlist top 4 for the final</Button>}
                title="Shortlist the top 4?" description="The 4 highest-scoring teams reach the final and all other teams are eliminated." confirmLabel="Shortlist" destructive onConfirm={() => top4.mutate()} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="max-w-lg border-destructive/50">
            <CardHeader><CardTitle>Reset event</CardTitle><CardDescription>Clears all answers, hints, scores, matches and timers. Teams are kept and return to Round 1 with 0 points. Questions and cipher messages are kept.</CardDescription></CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" className="w-full" disabled={reset.isPending}>Reset event</Button>} />
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Reset the whole event?</AlertDialogTitle><AlertDialogDescription>This cannot be undone. Type RESET to confirm.</AlertDialogDescription></AlertDialogHeader>
                  <Input aria-label="Type RESET to confirm" value={resetText} onChange={(e) => setResetText(e.target.value)} placeholder="RESET" />
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setResetText("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction disabled={resetText !== "RESET"} className={buttonVariants({ variant: "destructive" })} onClick={() => reset.mutate({ confirm: "RESET" })}>Reset event</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
