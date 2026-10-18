# Cyber Clash

Cyber Clash is a team competition app built with Next.js, Better Auth, tRPC, Drizzle, and PostgreSQL.

## Setup

1. Copy `.env.example` to `.env` and configure the database, Better Auth, and GitHub OAuth values. Set `ADMIN_EMAILS` to a comma-separated list of organizer email addresses.
2. Install dependencies with `bun install` and start PostgreSQL.
3. Apply the schema with `bun run db:push`.
4. Load the sample questions, ciphers, and evidence with `bun run db:seed`.
5. Run the app with `bun run dev`.

Teams register at `/login`. Organizers can use `/admin` to control rounds, grade investigations, and configure final battles. Players continue from `/dashboard`.

The admin console can close and reopen Round 3 submissions. Closing is enforced by the server. Its danger zone can reset competition data while keeping team accounts; it requires an admin session and the literal confirmation `RESET`.

Round 1 automatically submits answers still in the form when the timer expires. The server accepts those submissions for five seconds after the displayed deadline to allow the request to arrive.

The `event_state.round3_closed` column is part of the current schema. Apply schema changes with `bun run db:push` before using Round 3 submission controls.

## ZIP integration notes

The dashboard and organizer page from the update archives predate the current server-rendered dashboard and component-based organizer console. Their match-result, submission-lock, and reset controls were integrated into the current pages instead of replacing them. Existing battle authorization and Round 2 response filtering were retained where the archive versions were less restrictive.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
