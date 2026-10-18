// File: src/server/db/cyber-schema.ts
import { relations, sql } from "drizzle-orm";
import { pgTableCreator } from "drizzle-orm/pg-core";

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
  excluded: d.boolean().notNull().default(false), // organizer/test accounts: hidden from rankings
}));

// Round 1
export const quizQuestions = t("quiz_question", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  prompt: d.text().notNull(),
  answer: d.text().notNull(),
  points: d.integer().notNull().default(1),
  createdAt: d.timestamp({ withTimezone: true }).default(sql`clock_timestamp()`).notNull(),
}));
export const quizSubmissions = t("quiz_submission", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  teamId: d.uuid().notNull().references(() => teams.id),
  questionId: d.uuid().notNull().references(() => quizQuestions.id),
  correct: d.boolean().notNull(),
  createdAt: d.timestamp({ withTimezone: true }).default(sql`now()`).notNull(),
}));

// Round 2
export const cipherMessages = t("cipher_message", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  cipherType: d.varchar({ length: 40 }).notNull(), // caesar | morse | binary | substitution
  encrypted: d.text().notNull(),
  plaintext: d.text().notNull(),
  hintType: d.text().notNull(),     // tier 1 (2 pts)
  hintMethod: d.text().notNull(),   // tier 2 (4 pts)
  hintPartial: d.text().notNull(),  // tier 3 (6 pts)
  createdAt: d.timestamp({ withTimezone: true }).default(sql`clock_timestamp()`).notNull(),
}));
export const hintPurchases = t("hint_purchase", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  teamId: d.uuid().notNull().references(() => teams.id),
  messageId: d.uuid().notNull().references(() => cipherMessages.id),
  tier: d.integer().notNull(),
  cost: d.integer().notNull(),
}));
export const decryptions = t("decryption", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  teamId: d.uuid().notNull().references(() => teams.id),
  messageId: d.uuid().notNull().references(() => cipherMessages.id),
  decoded: d.text().notNull(),
  correct: d.boolean().notNull(),
}));

// Round 3
export const investigations = t("investigation", (d) => ({
  teamId: d.uuid().primaryKey().references(() => teams.id),
  answers: d.jsonb().$type<string[]>().notNull(), // exactly 7
  score: d.integer(), // set manually by admin
  submittedAt: d.timestamp({ withTimezone: true }).default(sql`now()`).notNull(),
}));
export const evidence = t("evidence", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  kind: d.varchar({ length: 30 }).notNull(), // character | conversation | email | log
  title: d.text().notNull(),
  body: d.text().notNull(),
  createdAt: d.timestamp({ withTimezone: true }).default(sql`clock_timestamp()`).notNull(),
}));
export const round3Questions = t("round3_question", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  prompt: d.text().notNull(),
  position: d.integer().notNull().default(0),
}));

// Final round
export const matches = t("match", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  stage: d.varchar({ length: 20 }).notNull(), // semi | final
  teamAId: d.uuid().notNull().references(() => teams.id),
  teamBId: d.uuid().notNull().references(() => teams.id),
  timerStartedAt: d.timestamp({ withTimezone: true }),
  durationSeconds: d.integer().notNull().default(90),
  winnerId: d.uuid().references(() => teams.id),
  suddenDeath: d.integer().notNull().default(0), // counts sudden-death rounds
}));
export const battleChallenges = t("battle_challenge", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  matchId: d.uuid().notNull().references(() => matches.id),
  teamId: d.uuid().notNull().references(() => teams.id), // author
  sentence: d.text().notNull(),
  cipherType: d.varchar({ length: 40 }).notNull(),
  encrypted: d.text(),
  approved: d.boolean().notNull().default(false),
  attempt: d.integer().notNull().default(0), // sudden-death round index
}));
export const battleSubmissions = t("battle_submission", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  matchId: d.uuid().notNull().references(() => matches.id),
  teamId: d.uuid().notNull().references(() => teams.id),
  answer: d.text().notNull(),
  correct: d.boolean().notNull(),
  submittedAt: d.timestamp({ withTimezone: true, mode: "date", precision: 3 }).notNull(),
  attempt: d.integer().notNull().default(0),
}));

export const teamRelations = relations(teams, ({ many }) => ({
  hints: many(hintPurchases),
}));
