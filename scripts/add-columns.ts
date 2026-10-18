// File: scripts/add-columns.ts
// Run once: bun run scripts/add-columns.ts
// Adds the columns introduced after the first db:push. Safe to run repeatedly.
import { sql } from "drizzle-orm";
import { db } from "@/server/db";

await db.execute(sql`ALTER TABLE cyberclash_quiz_question ADD COLUMN IF NOT EXISTS "createdAt" timestamptz NOT NULL DEFAULT clock_timestamp()`);
await db.execute(sql`ALTER TABLE cyberclash_team ADD COLUMN IF NOT EXISTS "excluded" boolean NOT NULL DEFAULT false`);
await db.execute(sql`ALTER TABLE cyberclash_cipher_message ADD COLUMN IF NOT EXISTS "createdAt" timestamptz NOT NULL DEFAULT clock_timestamp()`);
await db.execute(sql`ALTER TABLE cyberclash_evidence ADD COLUMN IF NOT EXISTS "createdAt" timestamptz NOT NULL DEFAULT clock_timestamp()`);
await db.execute(sql`CREATE TABLE IF NOT EXISTS cyberclash_round3_question (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), prompt text NOT NULL, position integer NOT NULL DEFAULT 0)`);
console.log("Columns ready ✔");
process.exit(0);
