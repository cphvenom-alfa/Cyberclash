import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
	battleChallenges,
	battleSubmissions,
	decryptions,
	eventState,
	hintPurchases,
	investigations,
	matches,
	quizSubmissions,
	teams,
} from "@/server/db/cyber-schema";
import { adminProcedure } from "./common";

export const teamRouter = createTRPCRouter({
	register: protectedProcedure
		.input(z.object({ name: z.string().trim().min(2).max(80) }))
		.mutation(async ({ ctx, input }) => {
			const admins = (process.env.ADMIN_EMAILS ?? "")
				.split(",")
				.map((email) => email.trim());
			if (admins.includes(ctx.session.user.email)) return null;
			const existing = await ctx.db.query.teams.findFirst({
				where: eq(teams.userId, ctx.session.user.id),
			});
			if (existing) return existing;
			try {
				const inserted = await ctx.db
					.insert(teams)
					.values({
						name: input.name,
						userId: ctx.session.user.id,
					})
					.returning();
				if (!inserted[0])
					throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
				return inserted[0];
			} catch (error) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "That team name is already in use.",
					cause: error,
				});
			}
		}),
	me: protectedProcedure.query(async ({ ctx }) => {
		const team = await ctx.db.query.teams.findFirst({
			where: eq(teams.userId, ctx.session.user.id),
		});
		const admins = (process.env.ADMIN_EMAILS ?? "")
			.split(",")
			.map((email) => email.trim());
		if (team && admins.includes(ctx.session.user.email) && !team.excluded) {
			await ctx.db
				.update(teams)
				.set({ excluded: true })
				.where(eq(teams.id, team.id));
			return { ...team, excluded: true };
		}
		return team;
	}),
	adminList: adminProcedure.query(({ ctx }) =>
		ctx.db.select().from(teams).where(eq(teams.excluded, false)),
	),
	resetEvent: adminProcedure
		.input(z.object({ confirm: z.literal("RESET") }))
		.mutation(async ({ ctx }) => {
			await ctx.db.transaction(async (tx) => {
				await tx.delete(battleSubmissions);
				await tx.delete(battleChallenges);
				await tx.delete(matches);
				await tx.delete(investigations);
				await tx.delete(decryptions);
				await tx.delete(hintPurchases);
				await tx.delete(quizSubmissions);
				await tx.delete(eventState);
				await tx.update(teams).set({
					points: 0,
					round: 1,
					eliminated: false,
				});
			});
			return { ok: true };
		}),
});
