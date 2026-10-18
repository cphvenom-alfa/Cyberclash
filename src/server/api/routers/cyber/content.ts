// File: src/server/api/routers/cyber/content.ts
import { count, eq, max } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter } from "@/server/api/trpc";
import { cipherMessages, decryptions, evidence, hintPurchases, investigations, quizQuestions, quizSubmissions, round3Questions } from "@/server/db/cyber-schema";
import { CIPHER_VALUES, encrypt, isValidKey, problem, sanitize } from "@/lib/ciphers";
import { adminProcedure } from "./common";

const question = z.object({
  prompt: z.string().trim().min(3, "Question is too short").max(1000),
  answer: z.string().trim().min(1, "Answer is required").max(300),
  points: z.number().int().min(1).max(100),
});

const hint = z.string().trim().min(1, "Every hint needs text").max(300);
const cipherInput = z.object({
  cipherType: z.enum(CIPHER_VALUES),
  plaintext: z.string().trim().min(2, "Message is too short").max(300),
  shift: z.number().int().min(1).max(25).optional(),
  key: z.string().trim().optional(),
  rails: z.number().int().min(2).max(6).optional(),
  hintType: hint, hintMethod: hint, hintPartial: hint,
});

const evidenceInput = z.object({
  kind: z.enum(["character", "conversation", "email", "log"]),
  title: z.string().trim().min(2, "Title is too short").max(120),
  body: z.string().trim().min(2, "Content is too short").max(8000),
});
const STARTER_QUESTIONS = [
  "Who is the cybercriminal?", "When did the attack take place?", "How did the attacker enter?",
  "What did the attacker steal or damage?", "Which clue from Round 2 points to the attacker?",
  "What mistake gave the attacker away?", "What should the company do to stop this happening again?",
];
// answers are stored by position, so the question list is frozen once any team has submitted
const assertUnlocked = async (db: typeof import("@/server/db").db) => {
  if ((await db.$count(investigations)) > 0)
    throw new TRPCError({ code: "BAD_REQUEST", message: "Teams have already submitted answers, so the question list is locked. You can still edit the wording." });
};

export const contentRouter = createTRPCRouter({
  listQuestions: adminProcedure.query(async ({ ctx }) => {
    const qs = await ctx.db.select().from(quizQuestions).orderBy(quizQuestions.createdAt);
    const counts = await ctx.db
      .select({ id: quizSubmissions.questionId, n: count() })
      .from(quizSubmissions)
      .groupBy(quizSubmissions.questionId);
    return qs.map((q) => ({ ...q, submissions: counts.find((c) => c.id === q.id)?.n ?? 0 }));
  }),

  createQuestion: adminProcedure.input(question).mutation(async ({ ctx, input }) => {
    await ctx.db.insert(quizQuestions).values(input);
    return { ok: true };
  }),

  // one per line:  question => answer1|answer2 => points (points optional, default 1)
  bulkCreateQuestions: adminProcedure
    .input(z.object({ text: z.string().max(50_000) }))
    .mutation(async ({ ctx, input }) => {
      const valid: z.infer<typeof question>[] = [];
      const errors: string[] = [];
      input.text.split("\n").forEach((raw, i) => {
        if (!raw.trim()) return;
        const [prompt, answer, pts] = raw.split("=>").map((p) => p.trim());
        const parsed = question.safeParse({ prompt, answer, points: pts ? Number(pts) : 1 });
        if (parsed.success) valid.push(parsed.data);
        else errors.push(`Line ${i + 1}: ${parsed.error.issues[0]?.message ?? "invalid"}`);
      });
      if (valid.length) await ctx.db.insert(quizQuestions).values(valid);
      return { created: valid.length, errors };
    }),

  updateQuestion: adminProcedure
    .input(question.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      await ctx.db.update(quizQuestions).set(rest).where(eq(quizQuestions.id, id));
      return { ok: true };
    }),

  // blocked once any team has answered it, so scores never change under teams' feet
  deleteQuestion: adminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    if ((await ctx.db.$count(quizSubmissions, eq(quizSubmissions.questionId, input.id))) > 0)
      throw new TRPCError({ code: "BAD_REQUEST", message: "Teams have already answered this question. Edit it instead." });
    await ctx.db.delete(quizQuestions).where(eq(quizQuestions.id, input.id));
    return { ok: true };
  }),

  // ---------- Round 2 cipher messages ----------
  listCiphers: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select().from(cipherMessages).orderBy(cipherMessages.createdAt);
    const buys = await ctx.db.select({ id: hintPurchases.messageId, n: count() }).from(hintPurchases).groupBy(hintPurchases.messageId);
    const solves = await ctx.db.select({ id: decryptions.messageId, n: count() }).from(decryptions).groupBy(decryptions.messageId);
    return rows.map((r) => ({ ...r, activity: (buys.find((b) => b.id === r.id)?.n ?? 0) + (solves.find((b) => b.id === r.id)?.n ?? 0) }));
  }),

  // the server does the encrypting, so the stored ciphertext always matches the stored plaintext
  createCipher: adminProcedure.input(cipherInput).mutation(async ({ ctx, input }) => {
    const bad = (message: string) => new TRPCError({ code: "BAD_REQUEST", message });
    const t = input.cipherType;
    if (t === "caesar" && !input.shift) throw bad("Choose a shift from 1 to 25");
    if (t === "railfence" && !input.rails) throw bad("Choose 2 to 6 rails");
    if (t === "substitution" && !isValidKey(input.key ?? "")) throw bad("The key must use each of the 26 letters exactly once");
    if (t === "vigenere" && !/^[A-Za-z]{2,20}$/.test(input.key ?? "")) throw bad("The keyword must be 2 to 20 letters");
    const plaintext = sanitize(t, input.plaintext);
    const issue = problem(t, plaintext);
    if (issue) throw bad(issue);
    const encrypted = encrypt(t, plaintext, { shift: input.shift, key: input.key, rails: input.rails });
    if (!encrypted.trim()) throw bad("Nothing to encrypt in that message");
    await ctx.db.insert(cipherMessages).values({
      cipherType: t, plaintext, encrypted,
      hintType: input.hintType, hintMethod: input.hintMethod, hintPartial: input.hintPartial,
    });
    return { encrypted };
  }),

  updateCipher: adminProcedure
    .input(z.object({ id: z.string().uuid(), plaintext: z.string().trim().min(2).max(300), encrypted: z.string().trim().min(1).max(2000), hintType: hint, hintMethod: hint, hintPartial: hint }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      await ctx.db.update(cipherMessages).set(rest).where(eq(cipherMessages.id, id));
      return { ok: true };
    }),

  deleteCipher: adminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const used = (await ctx.db.$count(hintPurchases, eq(hintPurchases.messageId, input.id))) + (await ctx.db.$count(decryptions, eq(decryptions.messageId, input.id)));
    if (used > 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Teams have already used this message. Edit it instead." });
    await ctx.db.delete(cipherMessages).where(eq(cipherMessages.id, input.id));
    return { ok: true };
  }),

  // ---------- Round 3 case file ----------
  listEvidence: adminProcedure.query(({ ctx }) => ctx.db.select().from(evidence).orderBy(evidence.createdAt)),
  createEvidence: adminProcedure.input(evidenceInput).mutation(async ({ ctx, input }) => { await ctx.db.insert(evidence).values(input); return { ok: true }; }),
  updateEvidence: adminProcedure.input(evidenceInput.extend({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const { id, ...rest } = input;
    await ctx.db.update(evidence).set(rest).where(eq(evidence.id, id));
    return { ok: true };
  }),
  deleteEvidence: adminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => { await ctx.db.delete(evidence).where(eq(evidence.id, input.id)); return { ok: true }; }),

  // ---------- Round 3 questions ----------
  listRound3Questions: adminProcedure.query(async ({ ctx }) => ({
    questions: await ctx.db.select().from(round3Questions).orderBy(round3Questions.position),
    locked: (await ctx.db.$count(investigations)) > 0,
  })),
  createRound3Question: adminProcedure.input(z.object({ prompt: z.string().trim().min(3, "Question is too short").max(500) })).mutation(async ({ ctx, input }) => {
    await assertUnlocked(ctx.db);
    const [m] = await ctx.db.select({ top: max(round3Questions.position) }).from(round3Questions);
    await ctx.db.insert(round3Questions).values({ prompt: input.prompt, position: (m?.top ?? 0) + 1 });
    return { ok: true };
  }),
  seedRound3Questions: adminProcedure.mutation(async ({ ctx }) => {
    await assertUnlocked(ctx.db);
    if ((await ctx.db.$count(round3Questions)) > 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Questions already exist" });
    await ctx.db.insert(round3Questions).values(STARTER_QUESTIONS.map((prompt, i) => ({ prompt, position: i + 1 })));
    return { created: STARTER_QUESTIONS.length };
  }),
  updateRound3Question: adminProcedure.input(z.object({ id: z.string().uuid(), prompt: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => {
    await ctx.db.update(round3Questions).set({ prompt: input.prompt }).where(eq(round3Questions.id, input.id));
    return { ok: true };
  }),
  deleteRound3Question: adminProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    await assertUnlocked(ctx.db);
    await ctx.db.delete(round3Questions).where(eq(round3Questions.id, input.id));
    return { ok: true };
  }),
  moveRound3Question: adminProcedure.input(z.object({ id: z.string().uuid(), direction: z.enum(["up", "down"]) })).mutation(async ({ ctx, input }) => {
    await assertUnlocked(ctx.db);
    const all = await ctx.db.select().from(round3Questions).orderBy(round3Questions.position);
    const i = all.findIndex((q) => q.id === input.id);
    const j = input.direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= all.length) return { ok: true };
    [all[i], all[j]] = [all[j]!, all[i]!];
    await ctx.db.transaction(async (tx) => {
      for (const [idx, q] of all.entries()) await tx.update(round3Questions).set({ position: idx + 1 }).where(eq(round3Questions.id, q.id));
    });
    return { ok: true };
  }),
});
