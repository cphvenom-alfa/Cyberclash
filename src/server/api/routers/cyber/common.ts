import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { protectedProcedure } from "@/server/api/trpc";
import { teams } from "@/server/db/cyber-schema";

export const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

// Set ADMIN_EMAILS="a@x.com,b@x.com" in .env
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
	const admins = (process.env.ADMIN_EMAILS ?? "")
		.split(",")
		.map((e) => e.trim());
	if (!admins.includes(ctx.session.user.email)) {
		throw new TRPCError({ code: "FORBIDDEN" });
	}
	return next();
});

export async function getMyTeam(
	db: typeof import("@/server/db").db,
	userId: string,
	minRound = 1,
) {
	const team = await db.query.teams.findFirst({
		where: eq(teams.userId, userId),
	});
	if (!team) throw new TRPCError({ code: "NOT_FOUND", message: "No team" });
	if (team.eliminated)
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Your team is out of the competition",
		});
	if (team.round < minRound)
		throw new TRPCError({
			code: "FORBIDDEN",
			message: `Round ${minRound} is not unlocked for your team yet`,
		});
	return team;
}
