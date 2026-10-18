// Idempotent sample data loader. It never deletes or overwrites rows.
import { count } from "drizzle-orm";
import { encodeCipher } from "@/lib/ciphers";
import { db } from "@/server/db";
import {
	cipherMessages,
	evidence,
	quizQuestions,
} from "@/server/db/cyber-schema";

const quizzes = [
	{ prompt: "What has keys but can't open locks?", answer: "keyboard" },
	{ prompt: "What gets wetter the more it dries?", answer: "towel" },
	{ prompt: "Next in the series: 2, 6, 12, 20, 30, ?", answer: "42" },
	{
		prompt: "I speak without a mouth and hear without ears. What am I?",
		answer: "echo",
	},
	{
		prompt:
			"If 5 machines make 5 widgets in 5 minutes, how many minutes for 100 machines to make 100 widgets?",
		answer: "5",
	},
];

const messages = [
	{
		cipherType: "caesar",
		plaintext: "the intruder used a stolen badge",
		hintType: "A shift cipher used by Roman generals",
		hintMethod: "Shift each letter back by 3",
		hintPartial: "the intruder used ...",
	},
	{
		cipherType: "morse",
		plaintext: "the breach happened at midnight",
		hintType: "Dots and dashes",
		hintMethod: "Slash separates words; spaces separate letters",
		hintPartial: "the breach happened ...",
	},
	{
		cipherType: "binary",
		plaintext: "check the server logs",
		hintType: "Only two symbols are used",
		hintMethod: "Each group of 8 bits is one ASCII character",
		hintPartial: "check the ...",
	},
];

try {
	if (
		(await db.select({ value: count() }).from(quizQuestions))[0]?.value === 0
	) {
		await db.insert(quizQuestions).values(quizzes);
	}
	if (
		(await db.select({ value: count() }).from(cipherMessages))[0]?.value === 0
	) {
		await db.insert(cipherMessages).values(
			messages.map((message) => ({
				...message,
				hintType: `Cipher type: ${message.cipherType}. ${message.hintType}`,
				encrypted: encodeCipher(message.plaintext, message.cipherType),
			})),
		);
	}
	if ((await db.select({ value: count() }).from(evidence))[0]?.value === 0) {
		await db.insert(evidence).values([
			{
				kind: "character",
				title: "Priya Nair – Sysadmin",
				body: "Eight years at the company. Works late on Thursdays. Holds the master access badge.",
			},
			{
				kind: "character",
				title: "Rohan Mehta – Contractor",
				body: "Joined 3 weeks ago. Badge was reported lost on Monday.",
			},
			{
				kind: "email",
				title: "Re: Badge replacement",
				body: "From: rohan@corp.test\nTo: facilities@corp.test\nPlease reissue my badge, I lost it near the parking area.",
			},
			{
				kind: "conversation",
				title: "Chat: Priya ↔ Security",
				body: "Priya: Door 4 kept beeping around midnight.\nSecurity: Probably a faulty reader.",
			},
			{
				kind: "log",
				title: "Door access log",
				body: "23:52 Door 4 BADGE#1187 GRANTED\n23:58 Server room BADGE#1187 GRANTED\n00:14 Server room BADGE#1187 EXIT",
			},
		]);
	}
	console.info(
		"Cyber Clash seed data is ready. Existing tables with rows were left unchanged.",
	);
} finally {
	await db.$client.end();
}
