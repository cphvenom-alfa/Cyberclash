// File: src/server/api/routers/cyber/round2.ts
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { adminProcedure, getMyTeam, norm } from "./common";
import { cipherMessages, decryptions, hintPurchases, teams } from "@/server/db/cyber-schema";

const HINT_COST = { 1: 2, 2: 4, 3: 6 } as const; // server decides cost, never the client
const POINTS_PER_DECRYPT = 10; // tune scoring here

type Db = typeof import("@/server/db").db;

async function computeScores(db: Db) {
    const all = await db.select().from(teams).where(eq(teams.excluded, false));
    const solved = await db.select().from(decryptions).where(eq(decryptions.correct, true));
    return all
      .map((t) => {
        const n = new Set(solved.filter((s) => s.teamId === t.id).map((s) => s.messageId)).size;
        return { teamId: t.id, name: t.name, decrypted: n, retained: t.points, score: n * POINTS_PER_DECRYPT + t.points };
      })
      .sort((a, b) => b.score - a.score);
}

export const round2Router = createTRPCRouter({
  loadEncryptedMessages: protectedProcedure.query(async ({ ctx }) => {
    const team = await getMyTeam(ctx.db, ctx.session.user.id, 2);
    const msgs = await ctx.db.select().from(cipherMessages).orderBy(cipherMessages.createdAt);
    const bought = await ctx.db.select().from(hintPurchases).where(eq(hintPurchases.teamId, team.id));
    const solvedRows = await ctx.db
      .select({ messageId: decryptions.messageId })
      .from(decryptions)
      .where(and(eq(decryptions.teamId, team.id), eq(decryptions.correct, true)));
    // cipherType is hidden until tier 1 is bought
    return msgs.map((m) => {
      const tiers = bought.filter((b) => b.messageId === m.id).map((b) => b.tier);
      const all: Record<number, string> = { 1: m.hintType, 2: m.hintMethod, 3: m.hintPartial };
      const hints: Record<number, string> = {};
      for (const t of tiers) hints[t] = all[t]!; // only hints this team paid for
      return {
        id: m.id,
        encrypted: m.encrypted,
        cipherType: tiers.includes(1) ? m.cipherType : null,
        boughtTiers: tiers,
        hints,
        purchasedHints: Object.entries(hints).map(([tier, hint]) => ({ tier: Number(tier), hint })),
        solved: solvedRows.some((row) => row.messageId === m.id),
      };
    });
  }),

  // purchaseHint + deductPointCurrency (atomic: the UPDATE only succeeds if balance suffices)
  purchaseHint: protectedProcedure
    .input(z.object({ messageId: z.string().uuid(), tier: z.union([z.literal(1), z.literal(2), z.literal(3)]) }))
    .mutation(async ({ ctx, input }) => {
      const team = await getMyTeam(ctx.db, ctx.session.user.id, 2);
      const cost = HINT_COST[input.tier];
      return ctx.db.transaction(async (tx) => {
        const dup = await tx.query.hintPurchases.findFirst({
          where: and(eq(hintPurchases.teamId, team.id), eq(hintPurchases.messageId, input.messageId), eq(hintPurchases.tier, input.tier)),
        });
        if (dup) throw new TRPCError({ code: "CONFLICT", message: "Hint already purchased" });

        const updated = await tx
          .update(teams)
          .set({ points: sql`${teams.points} - ${cost}` })
          .where(and(eq(teams.id, team.id), sql`${teams.points} >= ${cost}`))
          .returning({ points: teams.points });
        if (updated.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient points" });

        await tx.insert(hintPurchases).values({ teamId: team.id, messageId: input.messageId, tier: input.tier, cost });
        const m = await tx.query.cipherMessages.findFirst({ where: eq(cipherMessages.id, input.messageId) });
        if (!m) throw new TRPCError({ code: "NOT_FOUND" });
        const hint = input.tier === 1 ? m.hintType : input.tier === 2 ? m.hintMethod : m.hintPartial;
        return { hint, points: updated[0]!.points };
      });
    }),

  submitDecryptedMessage: protectedProcedure
    .input(z.object({ messageId: z.string().uuid(), decodedString: z.string().max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const team = await getMyTeam(ctx.db, ctx.session.user.id, 2);
      const m = await ctx.db.query.cipherMessages.findFirst({ where: eq(cipherMessages.id, input.messageId) });
      if (!m) throw new TRPCError({ code: "NOT_FOUND" });
      const already = await ctx.db.query.decryptions.findFirst({
        where: and(eq(decryptions.teamId, team.id), eq(decryptions.messageId, m.id), eq(decryptions.correct, true)),
      });
      if (already) return { correct: true };
      const correct = norm(m.plaintext) === norm(input.decodedString);
      await ctx.db.insert(decryptions).values({ teamId: team.id, messageId: m.id, decoded: input.decodedString, correct });
      return { correct };
    }),

  // admin
  calculateRoundTwoScore: adminProcedure.query(({ ctx }) => computeScores(ctx.db)),

  shortlistTeamsForRoundThree: adminProcedure
    .input(z.object({ topCountInt: z.number().int().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const ranked = (await computeScores(ctx.db)).slice(0, input.topCountInt);
      const ids = ranked.map((r) => r.teamId);
      await ctx.db.transaction(async (tx) => {
        for (const t of await tx.select().from(teams)) {
          if (t.excluded) continue;
          const inTop = ids.includes(t.id);
          await tx.update(teams).set({ round: inTop ? 3 : t.round, eliminated: !inTop }).where(eq(teams.id, t.id));
        }
      });
      return { advanced: ranked };
    }),
});
