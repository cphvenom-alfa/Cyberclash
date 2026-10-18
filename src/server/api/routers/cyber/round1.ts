// File: src/server/api/routers/cyber/round1.ts
import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { adminProcedure, getMyTeam, norm } from "./common";
import { eventState, quizQuestions, quizSubmissions, teams } from "@/server/db/cyber-schema";
import { TRPCError } from "@trpc/server";

export const round1Router = createTRPCRouter({
  // admin: startRoundOneTimer
  startRoundOneTimer: adminProcedure
    .input(z.object({ durationMinutes: z.number().int().min(1).max(180) }))
    .mutation(async ({ ctx, input }) => {
      if ((await ctx.db.$count(quizQuestions)) === 0)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Add at least one question before starting Round 1" });
      // refuse only if some team has really moved past Round 1 (a stale marker must not block a restart)
      if ((await ctx.db.$count(teams, gte(teams.round, 2))) > 0)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Teams have already moved past Round 1. Use Reset event to start over." });
      const endsAt = new Date(Date.now() + input.durationMinutes * 60_000);
      await ctx.db
        .insert(eventState)
        .values({ id: 1, currentRound: 1, roundOneEndsAt: endsAt })
        .onConflictDoUpdate({ target: eventState.id, set: { currentRound: 1, roundOneEndsAt: endsAt } });
      return { endsAt };
    }),

  // clients poll this and render the countdown from endsAt (server time is the truth)
  state: protectedProcedure.query(async ({ ctx }) => {
    const s = await ctx.db.query.eventState.findFirst();
    return { endsAt: s?.roundOneEndsAt ?? null, now: new Date(), round: s?.currentRound ?? 1 };
  }),

  questions: protectedProcedure.query(({ ctx }) =>
    ctx.db.select({ id: quizQuestions.id, prompt: quizQuestions.prompt }).from(quizQuestions).orderBy(quizQuestions.createdAt),
  ),

  submitQuizAnswer: protectedProcedure
    .input(z.object({ questionId: z.string().uuid(), answerString: z.string().max(500) }))
    .mutation(async ({ ctx, input }) => {
      const team = await getMyTeam(ctx.db, ctx.session.user.id);
      const st = await ctx.db.query.eventState.findFirst();
      // 5s grace so the client can auto-submit drafts the moment the timer hits zero
      if (!st?.roundOneEndsAt || st.roundOneEndsAt.getTime() + 5000 < Date.now())
        throw new TRPCError({ code: "BAD_REQUEST", message: "Round 1 is not open" });

      const q = await ctx.db.query.quizQuestions.findFirst({ where: eq(quizQuestions.id, input.questionId) });
      if (!q) throw new TRPCError({ code: "NOT_FOUND" });
      const done = await ctx.db.query.quizSubmissions.findFirst({
        where: and(eq(quizSubmissions.teamId, team.id), eq(quizSubmissions.questionId, q.id)),
      });
      if (done) throw new TRPCError({ code: "CONFLICT", message: "Already answered" });

      const correct = q.answer.split("|").some((a) => norm(a) === norm(input.answerString)); // "a|b" = several accepted answers
      await ctx.db.transaction(async (tx) => {
        await tx.insert(quizSubmissions).values({ teamId: team.id, questionId: q.id, correct });
        if (correct)
          await tx.update(teams).set({ points: sql`${teams.points} + ${q.points}` }).where(eq(teams.id, team.id));
      });
      return { correct }; // drop this field if you don't want to reveal right/wrong
    }),

  calculatePointCurrency: protectedProcedure.query(async ({ ctx }) => {
    const team = await getMyTeam(ctx.db, ctx.session.user.id);
    return { points: team.points };
  }),

  // admin: timer expired -> everyone moves on, nobody eliminated
  advanceAllTeamsToRoundTwo: adminProcedure.mutation(async ({ ctx }) => {
    const st = await ctx.db.query.eventState.findFirst();
    if (!st?.roundOneEndsAt || st.roundOneEndsAt > new Date())
      throw new TRPCError({ code: "BAD_REQUEST", message: "Round 1 timer has not finished yet" });
    // only teams still in Round 1: pressing this twice must never drag later-round teams backwards
    await ctx.db.update(teams).set({ round: 2 }).where(eq(teams.round, 1));
    await ctx.db.update(eventState).set({ currentRound: 2 });
    return { ok: true };
  }),
});