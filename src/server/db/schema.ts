import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	pgTableCreator,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `pg-drizzle_${name}`);

export const posts = createTable(
	"post",
	(d) => ({
		id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
		name: d.varchar({ length: 256 }),
		createdById: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => user.id),
		createdAt: d
			.timestamp({ withTimezone: true })
			.$defaultFn(() => new Date())
			.notNull(),
		updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
	}),
	(t) => [
		index("created_by_idx").on(t.createdById),
		index("name_idx").on(t.name),
	],
);

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified")
		.$defaultFn(() => false)
		.notNull(),
	image: text("image"),
	createdAt: timestamp("created_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
	updatedAt: timestamp("updated_at")
		.$defaultFn(() => /* @__PURE__ */ new Date())
		.notNull(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").$defaultFn(
		() => /* @__PURE__ */ new Date(),
	),
	updatedAt: timestamp("updated_at").$defaultFn(
		() => /* @__PURE__ */ new Date(),
	),
});

export const userRelations = relations(user, ({ many }) => ({
	account: many(account),
	session: many(session),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export * from "./cyber-schema";


import { sql } from "drizzle-orm";

const t = pgTableCreator((n) => `cyberclash_${n}`);

export const eventState = t("event_state", (d) => ({
	id: d.integer().primaryKey().default(1),
	currentRound: d.integer().notNull().default(1),
	roundOneEndsAt: d.timestamp({ withTimezone: true }),
	round3Closed: d.boolean().notNull().default(false),
}));

export const teams = t("team", (d) => ({
	id: d.uuid().primaryKey().defaultRandom(),
	name: d.varchar({ length: 80 }).notNull().unique(),
	userId: d.text().notNull().unique(), // BetterAuth user id (the team's login)
	points: d.integer().notNull().default(0),
	round: d.integer().notNull().default(1), // highest round unlocked
	eliminated: d.boolean().notNull().default(false),
	excluded: d.boolean().notNull().default(false), // organizer and test accounts are omitted from rankings
}));

// Round 1
export const quizQuestions = t("quiz_question", (d) => ({
	id: d.uuid().primaryKey().defaultRandom(),
	prompt: d.text().notNull(),
	answer: d.text().notNull(),
	points: d.integer().notNull().default(1),
	createdAt: d
		.timestamp({ withTimezone: true })
		.default(sql`clock_timestamp()`)
		.notNull(),
}));
export const quizSubmissions = t("quiz_submission", (d) => ({
	id: d.uuid().primaryKey().defaultRandom(),
	teamId: d
		.uuid()
		.notNull()
		.references(() => teams.id),
	questionId: d
		.uuid()
		.notNull()
		.references(() => quizQuestions.id),
	correct: d.boolean().notNull(),
	createdAt: d.timestamp({ withTimezone: true }).default(sql`now()`).notNull(),
}));

// Round 2
export const cipherMessages = t("cipher_message", (d) => ({
	id: d.uuid().primaryKey().defaultRandom(),
	cipherType: d.varchar({ length: 40 }).notNull(), // caesar | morse | binary | substitution
	encrypted: d.text().notNull(),
	plaintext: d.text().notNull(),
	hintType: d.text().notNull(), // tier 1 (2 pts)
	hintMethod: d.text().notNull(), // tier 2 (4 pts)
	hintPartial: d.text().notNull(), // tier 3 (6 pts)
}));
export const hintPurchases = t("hint_purchase", (d) => ({
	id: d.uuid().primaryKey().defaultRandom(),
	teamId: d
		.uuid()
		.notNull()
		.references(() => teams.id),
	messageId: d
		.uuid()
		.notNull()
		.references(() => cipherMessages.id),
	tier: d.integer().notNull(),
	cost: d.integer().notNull(),
}));
export const decryptions = t("decryption", (d) => ({
	id: d.uuid().primaryKey().defaultRandom(),
	teamId: d
		.uuid()
		.notNull()
		.references(() => teams.id),
	messageId: d
		.uuid()
		.notNull()
		.references(() => cipherMessages.id),
	decoded: d.text().notNull(),
	correct: d.boolean().notNull(),
}));

// Round 3
export const investigations = t("investigation", (d) => ({
	teamId: d
		.uuid()
		.primaryKey()
		.references(() => teams.id),
	answers: d.jsonb().$type<string[]>().notNull(), // exactly 7
	score: d.integer(), // set manually by admin
	submittedAt: d
		.timestamp({ withTimezone: true })
		.default(sql`now()`)
		.notNull(),
}));
export const evidence = t("evidence", (d) => ({
	id: d.uuid().primaryKey().defaultRandom(),
	kind: d.varchar({ length: 30 }).notNull(), // character | conversation | email | log
	title: d.text().notNull(),
	body: d.text().notNull(),
}));

// Final round
export const matches = t("match", (d) => ({
	id: d.uuid().primaryKey().defaultRandom(),
	stage: d.varchar({ length: 20 }).notNull(), // semi | final
	teamAId: d
		.uuid()
		.notNull()
		.references(() => teams.id),
	teamBId: d
		.uuid()
		.notNull()
		.references(() => teams.id),
	timerStartedAt: d.timestamp({ withTimezone: true }),
	durationSeconds: d.integer().notNull().default(90),
	winnerId: d.uuid().references(() => teams.id),
	suddenDeath: d.integer().notNull().default(0), // counts sudden-death rounds
	createdAt: d.timestamp({ withTimezone: true }).default(sql`now()`).notNull(),
}));
export const battleChallenges = t("battle_challenge", (d) => ({
	id: d.uuid().primaryKey().defaultRandom(),
	matchId: d
		.uuid()
		.notNull()
		.references(() => matches.id),
	teamId: d
		.uuid()
		.notNull()
		.references(() => teams.id), // author
	sentence: d.text().notNull(),
	cipherType: d.varchar({ length: 40 }).notNull(),
	encrypted: d.text(),
	approved: d.boolean().notNull().default(false),
	attempt: d.integer().notNull().default(0), // sudden-death round index
}));
export const battleSubmissions = t("battle_submission", (d) => ({
	id: d.uuid().primaryKey().defaultRandom(),
	matchId: d
		.uuid()
		.notNull()
		.references(() => matches.id),
	teamId: d
		.uuid()
		.notNull()
		.references(() => teams.id),
	answer: d.text().notNull(),
	correct: d.boolean().notNull(),
	submittedAt: d
		.timestamp({ withTimezone: true, mode: "date", precision: 3 })
		.notNull(),
	attempt: d.integer().notNull().default(0),
}));

export const teamRelations = relations(teams, ({ many }) => ({
	hints: many(hintPurchases),
}));
