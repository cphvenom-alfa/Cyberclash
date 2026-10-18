// File: src/app/admin/ciphers/page.tsx
"use client";
import { Pencil, Trash2, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CIPHER_TYPES, type CipherType, encrypt, isValidKey, problem, sanitize, suggestHints } from "@/lib/ciphers";
import { api } from "@/trpc/react";

type Edit = { id: string; cipherType: string; plaintext: string; encrypted: string; hintType: string; hintMethod: string; hintPartial: string };
const noHints = { hintType: "", hintMethod: "", hintPartial: "" };

export default function CiphersAdmin() {
  const utils = api.useUtils();
  const list = api.cyber.content.listCiphers.useQuery();
  const [type, setType] = useState<CipherType>("caesar");
  const [plaintext, setPlaintext] = useState("");
  const [shift, setShift] = useState("3");
  const [key, setKey] = useState("");
  const [rails, setRails] = useState("3");
  const [hints, setHints] = useState(noHints);
  const [editing, setEditing] = useState<Edit | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const done = (text: string) => { setMsg({ ok: true, text }); void utils.cyber.content.listCiphers.invalidate(); };
  const fail = (e: { message: string }) => setMsg({ ok: false, text: e.message });

  const create = api.cyber.content.createCipher.useMutation({ onSuccess: () => { done("Message added"); setPlaintext(""); setHints(noHints); }, onError: fail });
  const update = api.cyber.content.updateCipher.useMutation({ onSuccess: () => { done("Message updated"); setEditing(null); }, onError: fail });
  const remove = api.cyber.content.deleteCipher.useMutation({ onSuccess: () => done("Message deleted"), onError: fail });

  const meta = CIPHER_TYPES.find((c) => c.value === type)!;
  const shiftN = Number(shift) || 0;
  const railsN = Number(rails) || 0;
  const clean = useMemo(() => sanitize(type, plaintext), [type, plaintext]);
  const paramIssue =
    type === "caesar" && (shiftN < 1 || shiftN > 25) ? "Choose a shift from 1 to 25."
    : type === "railfence" && (railsN < 2 || railsN > 6) ? "Choose 2 to 6 rails."
    : type === "substitution" && !isValidKey(key) ? "Enter a key using each of the 26 letters once."
    : type === "vigenere" && !/^[A-Za-z]{2,20}$/.test(key) ? "Enter a keyword of 2 to 20 letters."
    : null;
  const issue = clean ? (problem(type, clean) ?? paramIssue) : null;
  const preview = clean && !issue ? encrypt(type, clean, { shift: shiftN, key, rails: railsN }) : "";
  const changed = !!plaintext.trim() && clean !== plaintext.trim();
  const ready = !!preview && !!hints.hintType && !!hints.hintMethod && !!hints.hintPartial;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <p className="text-sm text-muted-foreground">Organizer console</p>
        <h1 className="display text-4xl">Round 2 cipher messages</h1>
      </header>
      {msg && <p role="status" className={`rounded-md border px-4 py-2 text-sm ${msg.ok ? "border-emerald-500/40 text-emerald-300" : "border-destructive/60 text-rose-300"}`}>{msg.text}</p>}

      <Card>
        <CardHeader><CardTitle>Add a message</CardTitle><CardDescription>Type the plain message and pick a cipher. The encrypted text is created for you. Teams decode it, and decoded messages become their clues for Round 3.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Cipher</Label>
            <div className="flex flex-wrap gap-2">{CIPHER_TYPES.map((c) => <Button key={c.value} type="button" size="sm" variant={type === c.value ? "default" : "outline"} onClick={() => { setType(c.value); setKey(""); }}>{c.label}</Button>)}</div>
            <p className="text-sm text-muted-foreground"><Badge variant="secondary" className="mr-2">{meta.level}</Badge>{meta.info}</p>
          </div>
          <div className="space-y-2"><Label htmlFor="plain">Message (plain text)</Label><Textarea id="plain" rows={2} value={plaintext} onChange={(e) => setPlaintext(e.target.value)} placeholder="the intruder used a stolen badge" /></div>
          {type === "caesar" && <div className="space-y-2"><Label htmlFor="shift">Shift (1 to 25)</Label><Input id="shift" inputMode="numeric" className="w-24 text-center tabular-nums" value={shift} onChange={(e) => setShift(e.target.value.replace(/\D/g, "").slice(0, 2))} /></div>}
          {type === "railfence" && <div className="space-y-2"><Label htmlFor="rails">Rails (2 to 6)</Label><Input id="rails" inputMode="numeric" className="w-24 text-center tabular-nums" value={rails} onChange={(e) => setRails(e.target.value.replace(/\D/g, "").slice(0, 1))} /></div>}
          {type === "vigenere" && <div className="space-y-2"><Label htmlFor="vkey">Keyword (letters only)</Label><Input id="vkey" className="font-mono uppercase" maxLength={20} value={key} onChange={(e) => setKey(e.target.value.replace(/[^a-z]/gi, ""))} placeholder="CYBER" /></div>}
          {type === "substitution" && <div className="space-y-2"><Label htmlFor="key">Key: your 26-letter alphabet, A to Z in order</Label><Input id="key" className="font-mono uppercase" maxLength={26} value={key} onChange={(e) => setKey(e.target.value.replace(/[^a-z]/gi, ""))} placeholder="QWERTYUIOPASDFGHJKLZXCVBNM" /></div>}
          <div className="space-y-2"><Label>Encrypted result (what teams will see)</Label><pre className="min-h-12 whitespace-pre-wrap break-words rounded-md border border-border bg-black/40 p-3 font-mono text-sm text-[var(--cyan)]">{preview || "Type a message above"}</pre>
            {issue && <p className="text-sm text-[var(--gold)]">{issue}</p>}
            {changed && !issue && <p className="text-xs text-muted-foreground">This cipher cannot carry punctuation, so the message is saved as: “{clean}”</p>}</div>

          <div className="space-y-3 border-t border-border pt-5">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-sm font-medium">Hints teams can buy</p><p className="text-xs text-muted-foreground">Tier 1 costs 2 points, tier 2 costs 4, tier 3 costs 6.</p></div>
              <Button type="button" size="sm" variant="outline" disabled={!plaintext.trim()} onClick={() => setHints(suggestHints(type, clean || plaintext, { shift: shiftN, rails: railsN }))}><Wand2 className="h-4 w-4" /> Auto-fill</Button>
            </div>
            <div className="space-y-2"><Label htmlFor="h1">Tier 1: cipher type (2 pts)</Label><Input id="h1" value={hints.hintType} onChange={(e) => setHints({ ...hints, hintType: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="h2">Tier 2: decoding method (4 pts)</Label><Input id="h2" value={hints.hintMethod} onChange={(e) => setHints({ ...hints, hintMethod: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="h3">Tier 3: partial decoded message (6 pts)</Label><Input id="h3" value={hints.hintPartial} onChange={(e) => setHints({ ...hints, hintPartial: e.target.value })} /></div>
          </div>
          <Button disabled={!ready || create.isPending} onClick={() => create.mutate({ cipherType: type, plaintext, shift: type === "caesar" ? shiftN : undefined, key: type === "substitution" || type === "vigenere" ? key : undefined, rails: type === "railfence" ? railsN : undefined, ...hints })}>{create.isPending ? "Adding…" : "Add message"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All messages ({list.data?.length ?? 0})</CardTitle><CardDescription>Messages that teams have already used can be edited but not deleted.</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead className="w-10">#</TableHead><TableHead>Cipher</TableHead><TableHead>Encrypted</TableHead><TableHead>Plain text</TableHead><TableHead>Used</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {list.data?.map((m, i) => (
                <TableRow key={m.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell><Badge variant="secondary">{m.cipherType}</Badge></TableCell>
                  <TableCell className="max-w-[14rem] truncate font-mono text-xs">{m.encrypted}</TableCell>
                  <TableCell className="max-w-[14rem] whitespace-normal text-sm">{m.plaintext}</TableCell>
                  <TableCell><Badge variant="secondary">{m.activity}</Badge></TableCell>
                  <TableCell className="space-x-2 whitespace-nowrap text-right">
                    <Button size="sm" variant="outline" aria-label="Edit message" onClick={() => setEditing({ id: m.id, cipherType: m.cipherType, plaintext: m.plaintext, encrypted: m.encrypted, hintType: m.hintType, hintMethod: m.hintMethod, hintPartial: m.hintPartial })}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button size="sm" variant="outline" aria-label="Delete message" disabled={m.activity > 0}><Trash2 className="h-4 w-4" /></Button>} />
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete this message?</AlertDialogTitle><AlertDialogDescription>It will be removed from Round 2.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove.mutate({ id: m.id })}>Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {list.data?.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No messages yet. Add one above.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit message ({editing?.cipherType})</DialogTitle><DialogDescription>Edits are saved exactly as typed. If you change the plain text, update the encrypted text to match.</DialogDescription></DialogHeader>
          {editing && (
            <div className="space-y-4">
              {([["plaintext", "Plain text"], ["encrypted", "Encrypted text"], ["hintType", "Tier 1 hint"], ["hintMethod", "Tier 2 hint"], ["hintPartial", "Tier 3 hint"]] as const).map(([f, label]) => (
                <div key={f} className="space-y-2"><Label htmlFor={`e-${f}`}>{label}</Label><Textarea id={`e-${f}`} rows={2} value={editing[f]} onChange={(e) => setEditing({ ...editing, [f]: e.target.value })} /></div>
              ))}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={update.isPending} onClick={() => editing && update.mutate({ id: editing.id, plaintext: editing.plaintext, encrypted: editing.encrypted, hintType: editing.hintType, hintMethod: editing.hintMethod, hintPartial: editing.hintPartial })}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
