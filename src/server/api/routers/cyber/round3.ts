// File: src/server/api/routers/cyber/round3.ts
import { eq, desc, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { adminProcedure, getMyTeam } from "./common";
import { decryptions, cipherMessages, eventState, evidence, investigations, round3Questions, teams } from "@/server/db/cyber-schema";

export const round3Router = createTRPCRouter({
  myInvestigation: protectedProcedure.query(async ({ ctx }) => {
    const team = await getMyTeam(ctx.db, ctx.session.user.id, 3);
    return (await ctx.db.query.investigations.findFirst({ where: eq(investigations.teamId, team.id) })) ?? null;
  }),

  renderDigitalEvidence: protectedProcedure.query(async ({ ctx }) => {
    const team = await getMyTeam(ctx.db, ctx.session.user.id, 3);
    if (team.round < 3) throw new TRPCError({ code: "FORBIDDEN" });
    const files = await ctx.db.select().from(evidence).orderBy(evidence.createdAt);
    // show only messages this team actually decoded in Round 2
    const decoded = await ctx.db
      .select({ id: cipherMessages.id, plaintext: cipherMessages.plaintext })
      .from(decryptions)
      .innerJoin(cipherMessages, eq(cipherMessages.id, decryptions.messageId))
      .where(eq(decryptions.teamId, team.id));
    return { evidence: files, decodedMessages: decoded };
  }),

  submitInvestigationAnswers: protectedProcedure
    .input(z.object({ answersPayload: z.array(z.string().max(2000)).min(1).max(30) }))
    .mutation(async ({ ctx, input }) => {
      const team = await getMyTeam(ctx.db, ctx.session.user.id, 3);
      if (team.round < 3) throw new TRPCError({ code: "FORBIDDEN" });
      const st = await ctx.db.query.eventState.findFirst();
      if (st?.round3Closed) throw new TRPCError({ code: "BAD_REQUEST", message: "Round 3 submissions are closed" });
      if (input.answersPayload.length !== (await ctx.db.$count(round3Questions)))
        throw new TRPCError({ code: "BAD_REQUEST", message: "The question list changed. Refresh the page and try again." });
      await ctx.db
        .insert(investigations)
        .values({ teamId: team.id, answers: input.answersPayload })
        .onConflictDoUpdate({ target: investigations.teamId, set: { answers: input.answersPayload } });
      return { ok: true };
    }),

  questions: protectedProcedure.query(({ ctx }) =>
    ctx.db.select({ id: round3Questions.id, prompt: round3Questions.prompt }).from(round3Questions).orderBy(round3Questions.position),
  ),

  status: protectedProcedure.query(async ({ ctx }) => {
    const st = await ctx.db.query.eventState.findFirst();
    return { closed: st?.round3Closed ?? false };
  }),

  // admin: lock/unlock team submissions
  setSubmissionsClosed: adminProcedure
    .input(z.object({ closed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(eventState)
        .values({ id: 1, round3Closed: input.closed })
        .onConflictDoUpdate({ target: eventState.id, set: { round3Closed: input.closed } });
      return { closed: input.closed };
    }),

  // admin
  listSubmissions: adminProcedure.query(({ ctx }) =>
    ctx.db
      .select({ teamId: teams.id, name: teams.name, answers: investigations.answers, score: investigations.score })
      .from(investigations)
      .innerJoin(teams, eq(teams.id, investigations.teamId)),
  ),

  submitAdminScore: adminProcedure
    .input(z.object({ teamId: z.string().uuid(), scoreInt: z.number().int().min(0).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(investigations).set({ score: input.scoreInt }).where(eq(investigations.teamId, input.teamId));
      return { ok: true };
    }),

  shortlistTopFourForFinal: adminProcedure.mutation(async ({ ctx }) => {
    const top = await ctx.db
      .select({ teamId: investigations.teamId })
      .from(investigations)
      .where(isNotNull(investigations.score))
      .orderBy(desc(investigations.score))
      .limit(4);
    if (top.length !== 4) throw new TRPCError({ code: "BAD_REQUEST", message: "Need 4 graded teams" });
    const ids = top.map((t) => t.teamId);
    for (const t of await ctx.db.select().from(teams)) {
      await ctx.db.update(teams).set(ids.includes(t.id) ? { round: 4 } : { eliminated: true }).where(eq(teams.id, t.id));
    }
    return { finalists: ids };
  }),
});
