import { createTRPCRouter } from "@/server/api/trpc";
import { contentRouter } from "./content";
import { finalRouter } from "./final";
import { round1Router } from "./round1";
import { round2Router } from "./round2";
import { round3Router } from "./round3";
import { teamRouter } from "./team";

export const cyberRouter = createTRPCRouter({
	team: teamRouter,
	content: contentRouter,
	round1: round1Router,
	round2: round2Router,
	round3: round3Router,
	final: finalRouter,
});
