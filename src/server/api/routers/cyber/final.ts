import { TRPCError } from "@trpc/server";
import { and, asc, eq, or } from "drizzle-orm";
import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "@/server/api/trpc";
import {
	battleChallenges,
	battleSubmissions,
	matches,
	teams,
} from "@/server/db/cyber-schema";
import { adminProcedure, getMyTeam, norm } from "./common";

const opponentOf = (m: { teamAId: string; teamBId: string }, me: string) =>
	m.teamAId === me ? m.teamBId : m.teamAId;
const assertParticipant = (
	m: { teamAId: string; teamBId: string },
	teamId: string,
) => {
	if (m.teamAId !== teamId && m.teamBId !== teamId)
		throw new TRPCError({ code: "FORBIDDEN" });
};

export const finalRouter = createTRPCRouter({
	myMatch: protectedProcedure.query(async ({ ctx }) => {
		const team = await ctx.db.query.teams.findFirst({
			where: eq(teams.userId, ctx.session.user.id),
		});
		if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "No team" });
		return (
			(await ctx.db.query.matches.findFirst({
				where: or(eq(matches.teamAId, team.id), eq(matches.teamBId, team.id)),
				orderBy: (m, { desc }) => [desc(m.createdAt)],
			})) ?? null
		);
	}),
	// admin
	createMatch: adminProcedure
		.input(
			z
				.object({
					stage: z.enum(["semi", "final"]),
					teamAId: z.string().uuid(),
					teamBId: z.string().uuid(),
				})
				.refine(
					(input) => input.teamAId !== input.teamBId,
					"A team cannot play itself",
				),
		)
		.mutation(
			async ({ ctx, input }) =>
				(await ctx.db.insert(matches).values(input).returning())[0],
		),

	assignSentenceAndCipher: adminProcedure
		.input(
			z.object({
				matchId: z.string().uuid(),
				teamId: z.string().uuid(),
				sentenceString: z.string(),
				cipherType: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const m = await ctx.db.query.matches.findFirst({
				where: eq(matches.id, input.matchId),
			});
			if (!m) throw new TRPCError({ code: "NOT_FOUND" });
			if (input.teamId !== m.teamAId && input.teamId !== m.teamBId)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Challenge recipient must be a match participant",
				});
			if (m.timerStartedAt)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "The battle has already started",
				});
			const existing = await ctx.db.query.battleChallenges.findFirst({
				where: and(
					eq(battleChallenges.matchId, m.id),
					eq(battleChallenges.teamId, input.teamId),
					eq(battleChallenges.attempt, m.suddenDeath),
				),
			});
			if (existing) {
				await ctx.db
					.update(battleChallenges)
					.set({
						sentence: input.sentenceString,
						cipherType: input.cipherType,
						encrypted: null,
						approved: false,
					})
					.where(eq(battleChallenges.id, existing.id));
			} else {
				await ctx.db.insert(battleChallenges).values({
					matchId: m.id,
					teamId: input.teamId,
					sentence: input.sentenceString,
					cipherType: input.cipherType,
					attempt: m.suddenDeath,
				});
			}
			return { ok: true };
		}),

	myAssignment: protectedProcedure
		.input(z.object({ matchId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const team = await getMyTeam(ctx.db, ctx.session.user.id, 4);
			const m = await ctx.db.query.matches.findFirst({
				where: eq(matches.id, input.matchId),
			});
			if (!m) throw new TRPCError({ code: "NOT_FOUND" });
			assertParticipant(m, team.id);
			return ctx.db.query.battleChallenges.findFirst({
				where: and(
					eq(battleChallenges.matchId, input.matchId),
					eq(battleChallenges.teamId, team.id),
					eq(battleChallenges.attempt, m?.suddenDeath ?? 0),
				),
			});
		}),

	submitEncryptedChallenge: protectedProcedure
		.input(
			z.object({
				matchId: z.string().uuid(),
				encryptedString: z.string().max(1000),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const team = await getMyTeam(ctx.db, ctx.session.user.id, 4);
			const m = await ctx.db.query.matches.findFirst({
				where: eq(matches.id, input.matchId),
			});
			if (!m) throw new TRPCError({ code: "NOT_FOUND" });
			if (m.timerStartedAt)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "The battle has already started",
				});
			assertParticipant(m, team.id);
			await ctx.db
				.update(battleChallenges)
				.set({ encrypted: input.encryptedString, approved: false })
				.where(
					and(
						eq(battleChallenges.matchId, m.id),
						eq(battleChallenges.teamId, team.id),
						eq(battleChallenges.attempt, m.suddenDeath),
					),
				);
			return { ok: true };
		}),

	approveEncryptedChallenge: adminProcedure
		.input(
			z.object({
				matchId: z.string().uuid(),
				teamId: z.string().uuid(),
				isApprovedBool: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const m = await ctx.db.query.matches.findFirst({
				where: eq(matches.id, input.matchId),
			});
			if (!m) throw new TRPCError({ code: "NOT_FOUND" });
			if (input.teamId !== m.teamAId && input.teamId !== m.teamBId)
				throw new TRPCError({ code: "BAD_REQUEST" });
			const challenge = await ctx.db.query.battleChallenges.findFirst({
				where: and(
					eq(battleChallenges.matchId, m.id),
					eq(battleChallenges.teamId, input.teamId),
					eq(battleChallenges.attempt, m.suddenDeath),
				),
			});
			if (!challenge?.encrypted)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "There is no encrypted challenge to approve",
				});
			await ctx.db
				.update(battleChallenges)
				.set({ approved: input.isApprovedBool })
				.where(eq(battleChallenges.id, challenge.id));
			return { ok: true };
		}),

	// admin: both approved -> starts the clock for both teams at the same instant
	startBattleTimer: adminProcedure
		.input(
			z.object({
				matchId: z.string().uuid(),
				durationSeconds: z.number().int().min(10).max(600),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const m = await ctx.db.query.matches.findFirst({
				where: eq(matches.id, input.matchId),
			});
			if (!m) throw new TRPCError({ code: "NOT_FOUND" });
			if (m.timerStartedAt)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "The battle is already running",
				});
			const cs = await ctx.db
				.select()
				.from(battleChallenges)
				.where(eq(battleChallenges.matchId, input.matchId));
			const live = cs.filter(
				(c) => c.attempt === m.suddenDeath && c.approved && c.encrypted,
			);
			if (live.length !== 2)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Both challenges must be approved",
				});
			const startedAt = new Date();
			await ctx.db
				.update(matches)
				.set({
					timerStartedAt: startedAt,
					durationSeconds: input.durationSeconds,
				})
				.where(eq(matches.id, input.matchId));
			return { startedAt };
		}),

	// public read (also use on /projector/[matchId]) -- no secrets returned
	matchState: publicProcedure
		.input(z.object({ matchId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const m = await ctx.db.query.matches.findFirst({
				where: eq(matches.id, input.matchId),
			});
			if (!m) throw new TRPCError({ code: "NOT_FOUND" });
			return { ...m, now: new Date() };
		}),

	// routeChallengeToOpponent: you only ever see the OPPONENT's approved ciphertext, only once timer runs
	routeChallengeToOpponent: protectedProcedure
		.input(z.object({ matchId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const team = await getMyTeam(ctx.db, ctx.session.user.id, 4);
			const m = await ctx.db.query.matches.findFirst({
				where: eq(matches.id, input.matchId),
			});
			if (!m) throw new TRPCError({ code: "NOT_FOUND" });
			assertParticipant(m, team.id);
			if (!m?.timerStartedAt)
				throw new TRPCError({ code: "BAD_REQUEST", message: "Not started" });
			const c = await ctx.db.query.battleChallenges.findFirst({
				where: and(
					eq(battleChallenges.matchId, m.id),
					eq(battleChallenges.teamId, opponentOf(m, team.id)),
					eq(battleChallenges.approved, true),
					eq(battleChallenges.attempt, m.suddenDeath),
				),
			});
			return {
				encrypted: c?.encrypted ?? null,
				cipherType: c?.cipherType ?? null,
			};
		}),

	// timestamp is taken on the SERVER; the client-supplied one is never trusted
	submitFinalDecryption: protectedProcedure
		.input(
			z.object({
				matchId: z.string().uuid(),
				answerString: z.string().max(1000),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const team = await getMyTeam(ctx.db, ctx.session.user.id, 4);
			const submittedAt = new Date();
			const m = await ctx.db.query.matches.findFirst({
				where: eq(matches.id, input.matchId),
			});
			if (!m?.timerStartedAt)
				throw new TRPCError({ code: "BAD_REQUEST", message: "Not started" });
			assertParticipant(m, team.id);
			if (
				submittedAt.getTime() >
				m.timerStartedAt.getTime() + m.durationSeconds * 1000
			)
				throw new TRPCError({ code: "BAD_REQUEST", message: "Time is up" });
			const prior = await ctx.db.query.battleSubmissions.findFirst({
				where: and(
					eq(battleSubmissions.matchId, m.id),
					eq(battleSubmissions.teamId, team.id),
					eq(battleSubmissions.attempt, m.suddenDeath),
				),
			});
			if (prior)
				throw new TRPCError({ code: "CONFLICT", message: "Already submitted" });
			const c = await ctx.db.query.battleChallenges.findFirst({
				where: and(
					eq(battleChallenges.matchId, m.id),
					eq(battleChallenges.teamId, opponentOf(m, team.id)),
					eq(battleChallenges.attempt, m.suddenDeath),
				),
			});
			const correct = !!c && norm(c.sentence) === norm(input.answerString);
			await ctx.db.insert(battleSubmissions).values({
				matchId: m.id,
				teamId: team.id,
				answer: input.answerString,
				correct,
				submittedAt,
				attempt: m.suddenDeath,
			});
			return { received: true };
		}),

	// admin: correct + earliest wins; null winner = tie -> triggerSuddenDeath
	calculateBattleWinner: adminProcedure
		.input(z.object({ matchId: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const m = await ctx.db.query.matches.findFirst({
				where: eq(matches.id, input.matchId),
			});
			if (!m) throw new TRPCError({ code: "NOT_FOUND" });
			if (!m.timerStartedAt)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Battle timer has not started",
				});
			const allSubmissions = await ctx.db
				.select()
				.from(battleSubmissions)
				.where(
					and(
						eq(battleSubmissions.matchId, m.id),
						eq(battleSubmissions.attempt, m.suddenDeath),
					),
				)
				.orderBy(asc(battleSubmissions.submittedAt));
			const bothSubmitted =
				new Set(allSubmissions.map((submission) => submission.teamId)).size ===
				2;
			const deadline = m.timerStartedAt.getTime() + m.durationSeconds * 1000;
			if (!bothSubmitted && Date.now() < deadline)
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Wait until both teams submit or the timer expires",
				});
			const subs = allSubmissions.filter((submission) => submission.correct);
			const [first, second] = subs;
			if (!first)
				return { winnerId: null, tie: true, reason: "no correct answers" };
			if (
				second &&
				first.submittedAt.getTime() === second.submittedAt.getTime()
			)
				return { winnerId: null, tie: true, reason: "exact tie" };
			await ctx.db
				.update(matches)
				.set({ winnerId: first.teamId })
				.where(eq(matches.id, m.id));
			return { winnerId: first.teamId, tie: false };
		}),

	// admin: new round; clears timer, then re-run assign -> encrypt -> approve -> start
	triggerSuddenDeath: adminProcedure
		.input(z.object({ matchId: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const m = await ctx.db.query.matches.findFirst({
				where: eq(matches.id, input.matchId),
			});
			if (!m) throw new TRPCError({ code: "NOT_FOUND" });
			await ctx.db
				.update(matches)
				.set({
					suddenDeath: m.suddenDeath + 1,
					timerStartedAt: null,
					winnerId: null,
				})
				.where(eq(matches.id, m.id));
			return { attempt: m.suddenDeath + 1 };
		}),

	// admin: finalists + live challenge/submission view for the approval screen
	finalists: adminProcedure.query(({ ctx }) =>
		ctx.db
			.select({ id: teams.id, name: teams.name })
			.from(teams)
			.where(eq(teams.round, 4)),
	),
	adminMatches: adminProcedure.query(({ ctx }) =>
		ctx.db.select().from(matches),
	),
	adminMatchView: adminProcedure
		.input(z.object({ matchId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const m = await ctx.db.query.matches.findFirst({
				where: eq(matches.id, input.matchId),
			});
			if (!m) throw new TRPCError({ code: "NOT_FOUND" });
			const challenges = await ctx.db
				.select()
				.from(battleChallenges)
				.where(
					and(
						eq(battleChallenges.matchId, m.id),
						eq(battleChallenges.attempt, m.suddenDeath),
					),
				);
			const submissions = await ctx.db
				.select()
				.from(battleSubmissions)
				.where(
					and(
						eq(battleSubmissions.matchId, m.id),
						eq(battleSubmissions.attempt, m.suddenDeath),
					),
				);
			return { match: m, challenges, submissions };
		}),
});
