// File: src/app/admin/casefile/page.tsx
"use client";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";

const KINDS = [
  { value: "character", label: "Character", hint: "Name, role, how long they have worked here, anything notable…" },
  { value: "conversation", label: "Conversation", hint: "Priya: Door 4 kept beeping around midnight.\nSecurity: Probably a faulty reader." },
  { value: "email", label: "Email", hint: "From: rohan@corp.test\nTo: facilities@corp.test\nSubject: Lost badge\n\nPlease reissue my badge…" },
  { value: "log", label: "Access log", hint: "23:52 Door 4 BADGE#1187 GRANTED\n23:58 Server room BADGE#1187 GRANTED" },
] as const;
type Kind = (typeof KINDS)[number]["value"];
type EditEv = { id: string; kind: Kind; title: string; body: string };

export default function CaseFile() {
  const utils = api.useUtils();
  const evidence = api.cyber.content.listEvidence.useQuery();
  const qs = api.cyber.content.listRound3Questions.useQuery();
  const [kind, setKind] = useState<Kind>("email");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [prompt, setPrompt] = useState("");
  const [editEv, setEditEv] = useState<EditEv | null>(null);
  const [editQ, setEditQ] = useState<{ id: string; prompt: string } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const ok = (text: string) => { setMsg({ ok: true, text }); void utils.cyber.content.invalidate(); };
  const bad = (e: { message: string }) => setMsg({ ok: false, text: e.message });
  const c = api.cyber.content;

  const addEv = c.createEvidence.useMutation({ onSuccess: () => { ok("Evidence added"); setTitle(""); setBody(""); }, onError: bad });
  const saveEv = c.updateEvidence.useMutation({ onSuccess: () => { ok("Evidence updated"); setEditEv(null); }, onError: bad });
  const delEv = c.deleteEvidence.useMutation({ onSuccess: () => ok("Evidence deleted"), onError: bad });
  const addQ = c.createRound3Question.useMutation({ onSuccess: () => { ok("Question added"); setPrompt(""); }, onError: bad });
  const starter = c.seedRound3Questions.useMutation({ onSuccess: (r) => ok(`Added ${r.created} starter questions`), onError: bad });
  const saveQ = c.updateRound3Question.useMutation({ onSuccess: () => { ok("Question updated"); setEditQ(null); }, onError: bad });
  const delQ = c.deleteRound3Question.useMutation({ onSuccess: () => ok("Question deleted"), onError: bad });
  const move = c.moveRound3Question.useMutation({ onSuccess: () => ok("Order updated"), onError: bad });

  const locked = qs.data?.locked ?? false;
  const questions = qs.data?.questions ?? [];
  const kindMeta = KINDS.find((k) => k.value === kind)!;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <p className="text-sm text-muted-foreground">Organizer console</p>
        <h1 className="display text-4xl">Round 3 case file</h1>
      </header>
      {msg && <p role="status" className={`rounded-md border px-4 py-2 text-sm ${msg.ok ? "border-emerald-500/40 text-emerald-300" : "border-destructive/60 text-rose-300"}`}>{msg.text}</p>}

      <Tabs defaultValue="evidence" className="space-y-6">
        <TabsList><TabsTrigger value="evidence">Evidence ({evidence.data?.length ?? 0})</TabsTrigger><TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger></TabsList>

        <TabsContent value="evidence" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Add evidence</CardTitle><CardDescription>Everything teams can read in the digital case file. Tie each item to your Round 2 clues.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Type</Label><div className="flex flex-wrap gap-2">{KINDS.map((k) => <Button key={k.value} type="button" size="sm" variant={kind === k.value ? "default" : "outline"} onClick={() => setKind(k.value)}>{k.label}</Button>)}</div></div>
              <div className="space-y-2"><Label htmlFor="ev-title">Title</Label><Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Re: Badge replacement" /></div>
              <div className="space-y-2"><Label htmlFor="ev-body">Content</Label><Textarea id="ev-body" rows={7} className="font-mono text-xs" value={body} onChange={(e) => setBody(e.target.value)} placeholder={kindMeta.hint} /></div>
              <Button disabled={addEv.isPending || title.trim().length < 2 || body.trim().length < 2} onClick={() => addEv.mutate({ kind, title, body })}>Add evidence</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>All evidence</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Title</TableHead><TableHead>Content</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {evidence.data?.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell><Badge variant="secondary">{e.kind}</Badge></TableCell>
                      <TableCell className="font-medium">{e.title}</TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-muted-foreground">{e.body}</TableCell>
                      <TableCell className="space-x-2 whitespace-nowrap text-right">
                        <Button size="sm" variant="outline" aria-label="Edit" onClick={() => setEditEv({ id: e.id, kind: e.kind as Kind, title: e.title, body: e.body })}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button size="sm" variant="outline" aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>} />
                          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this evidence?</AlertDialogTitle><AlertDialogDescription>"{e.title}" disappears from every team's case file.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => delEv.mutate({ id: e.id })}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {evidence.data?.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No evidence yet. Add some above.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          {locked && <p className="rounded-md border border-[var(--gold)]/40 px-4 py-2 text-sm text-[var(--gold)]">Teams have submitted answers, so adding, deleting and reordering are locked. You can still edit the wording.</p>}
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1.5"><CardTitle>Investigation questions</CardTitle><CardDescription>Teams answer these in order. The brief suggests who, when and how, then more to test their reasoning.</CardDescription></div>
              {questions.length === 0 && <Button variant="outline" size="sm" disabled={starter.isPending} onClick={() => starter.mutate()}>Load 7 starter questions</Button>}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2"><Input aria-label="New question" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Who is the cybercriminal?" disabled={locked} /><Button disabled={locked || addQ.isPending || prompt.trim().length < 3} onClick={() => addQ.mutate({ prompt })}>Add</Button></div>
              <ol className="space-y-2">
                {questions.map((q, i) => (
                  <li key={q.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                    <span className="display w-6 text-xl text-muted-foreground">{i + 1}</span>
                    <span className="flex-1 text-sm">{q.prompt}</span>
                    <Button size="icon" variant="outline" aria-label="Move up" disabled={locked || i === 0} onClick={() => move.mutate({ id: q.id, direction: "up" })}><ArrowUp className="h-4 w-4" /></Button>
                    <Button size="icon" variant="outline" aria-label="Move down" disabled={locked || i === questions.length - 1} onClick={() => move.mutate({ id: q.id, direction: "down" })}><ArrowDown className="h-4 w-4" /></Button>
                    <Button size="icon" variant="outline" aria-label="Edit" onClick={() => setEditQ({ id: q.id, prompt: q.prompt })}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                       <AlertDialogTrigger render={<Button size="icon" variant="outline" aria-label="Delete" disabled={locked}><Trash2 className="h-4 w-4" /></Button>} />
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this question?</AlertDialogTitle><AlertDialogDescription>"{q.prompt}"</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => delQ.mutate({ id: q.id })}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ol>
              {questions.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No questions yet. Teams cannot submit until you add some.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editEv} onOpenChange={(o) => !o && setEditEv(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit evidence ({editEv?.kind})</DialogTitle><DialogDescription>Changes show immediately in teams' case files.</DialogDescription></DialogHeader>
          {editEv && <div className="space-y-4"><div className="space-y-2"><Label htmlFor="e-title">Title</Label><Input id="e-title" value={editEv.title} onChange={(e) => setEditEv({ ...editEv, title: e.target.value })} /></div><div className="space-y-2"><Label htmlFor="e-body">Content</Label><Textarea id="e-body" rows={8} className="font-mono text-xs" value={editEv.body} onChange={(e) => setEditEv({ ...editEv, body: e.target.value })} /></div></div>}
          <DialogFooter><Button variant="outline" onClick={() => setEditEv(null)}>Cancel</Button><Button disabled={saveEv.isPending} onClick={() => editEv && saveEv.mutate(editEv)}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editQ} onOpenChange={(o) => !o && setEditQ(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit question</DialogTitle><DialogDescription>Wording changes apply to everyone immediately.</DialogDescription></DialogHeader>
          {editQ && <Textarea aria-label="Question" rows={3} value={editQ.prompt} onChange={(e) => setEditQ({ ...editQ, prompt: e.target.value })} />}
          <DialogFooter><Button variant="outline" onClick={() => setEditQ(null)}>Cancel</Button><Button disabled={saveQ.isPending} onClick={() => editQ && saveQ.mutate(editQ)}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
