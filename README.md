# Love All · Tennis matchups

Find players at your level and get on court. Web MVP.

## Getting started

```bash
npm install
npm run db:seed   # optional: load demo data
npm run dev
```

Open http://localhost:3000. Demo account: `demo@loveall.dev` / `tennis123` (only exists after seeding).

A fresh clone needs a `.env` — copy `.env.example`:

```bash
cp .env.example .env
openssl rand -base64 32   # put the result in AUTH_SECRET
npx prisma migrate dev
```

## What works today

- **Accounts** — email + password (bcrypt-hashed); the session is a JWT in an httpOnly cookie, good for 30 days
- **Hosting a match** — court, city, country and the court's time zone, plus time, duration, format (singles / doubles / drills), player count, cost per person in any currency, NTRP range and notes. There is a short version in the sidebar of the match list and a full one at `/matches/new`
- **Browsing and filtering** — search any city, country or court, filter by format, or show only matches you're eligible for; three tabs: all / I'm playing / hosting
- **Joining** — join and leave; full matches are blocked, and an out-of-range NTRP is refused with the reason; the host takes a spot automatically and can only cancel the whole match
- **Messages** — a message board on every match
- **Profile** — display name, avatar, self-rated NTRP, home court, singles/doubles preference, short bio

## Anywhere in the world

A court is a physical place, so a match carries its city, country and IANA time
zone. `startsAt` is stored as an absolute instant, and the host enters wall-clock
time at the court — `src/lib/time.ts` converts between the two, so a match posted
in Tokyo reads as 07:00 JST whether it is browsed from Berlin or from the server.
Fees are quoted in the currency the court bills in, including zero-decimal ones
like JPY.

## Stack

Next.js 16 (App Router + Server Actions), React 19, TypeScript, Tailwind v4, Prisma 7 + SQLite.

There's no separate API layer — pages are Server Components that query the database directly, and writes go through Server Actions.

## Layout

```
prisma/schema.prisma      Data model: User / Match / Signup / Comment
prisma/seed.ts            Demo data
src/lib/prisma.ts         Prisma client (better-sqlite3 driver adapter)
src/lib/auth.ts           Session issuing and reading
src/lib/actions/          Server Actions: auth.ts / matches.ts
src/lib/format.ts         Display logic for NTRP, countries, levels and money
src/lib/time.ts           Time-zone conversion and formatting
src/components/hero.tsx   Landing cover above the match list
src/app/matches/          List, detail, create
src/components/           Cards, join buttons, message form
```

## Commands

```bash
npm run dev          # dev server
npm run build        # production build
npm run db:seed      # wipe and reload demo data
npm run db:reset     # drop the database and re-run migrations
npm run db:studio    # browse data in Prisma Studio
```

## Before going live

- Replace `AUTH_SECRET` with a real random value; don't ship the development one
- Move from SQLite to Postgres: change the provider in `prisma/schema.prisma` and swap `@prisma/adapter-better-sqlite3` for the matching adapter
- There's no email verification or password reset, and no rate limiting — the login route wants some
- The `capacity` check runs inside a transaction, which is enough for single-node SQLite; confirm the isolation level after switching databases

## Possible next steps

Court search by distance or map, social sign-in, a waitlist when matches fill, no-show tracking and a reliability score, post-match ratings to calibrate NTRP, reminders before start time.
