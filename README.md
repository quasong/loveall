# Love All · Tennis matchups

Find players at your level and get on court. Web MVP.

## Getting started

```bash
createdb loveall          # PostgreSQL 14+; 18 is what this was built against
npm install
npx prisma migrate dev    # create the tables
npm run db:seed           # optional: load demo data
npm run dev
```

Open http://localhost:3000. Demo account: `demo@loveall.dev` / `tennis123` (only exists after seeding).

A fresh clone needs a `.env` — copy `.env.example`:

```bash
cp .env.example .env
openssl rand -base64 32   # put the result in AUTH_SECRET
```

## What works today

- **Accounts** — sign-up is Google only. A username and a password are offered straight afterwards, both optional and both changeable later from the profile. With a password set, either the username or the Google address works as the login identifier. The session is a JWT in an httpOnly cookie, good for 30 days
- **Hosting a match** — court, city, country and the court's time zone, plus time, duration, format (singles / doubles / drills), player count, cost per person in any currency, NTRP range and notes. There is a short version in the sidebar of the match list and a full one at `/matches/new`
- **Browsing and filtering** — search any city, country or court, filter by format, or show only matches you're eligible for; three tabs: all / I'm playing / hosting
- **Joining** — join and leave; full matches are blocked, and an out-of-range NTRP is refused with the reason; the host takes a spot automatically and can only cancel the whole match
- **Messages** — a message board on every match
- **Profile** — display name, avatar, self-rated NTRP, home court, singles/doubles preference, short bio

## Accounts, usernames and passwords

There is no email registration form. Every account starts at Google, which is
also where the email address comes from — always verified, and stored, since it
doubles as a login identifier.

Three fields do three different jobs, and it is worth keeping them apart:

| Field | Unique | Purpose |
| --- | --- | --- |
| `email` | yes | Comes from Google; can be used to sign in |
| `username` | yes | The public handle, `@ace`. Null until claimed — setup is skippable |
| `name` | no | Display name on matches. Two players can both be "Ace" |

Handles follow Instagram's shape (`src/lib/username.ts`): letters, numbers,
periods and underscores, up to 30 characters, no leading or trailing period and
no two periods in a row. They are stored lowercase so `@Ace` and `@ace` cannot
both exist, and a reserved list keeps route names like `login` and `profile` out
of circulation, since a handle is the sort of thing that ends up in a URL.

A password is optional throughout. Without one an account signs in with Google
only, and a password attempt against it says so rather than "incorrect". Setting
the first password needs nothing extra; changing an existing one requires the
current password, so a borrowed session cannot lock the owner out.

## Google sign-in

Optional: leave `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` unset and the button
tells the visitor it isn't configured. To turn it on, create an OAuth client at
[console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials):

1. **Create credentials → OAuth client ID → Web application**
2. Authorised redirect URI: `http://localhost:3000/api/auth/google/callback`
   (and `https://your-domain/api/auth/google/callback` for production — it must
   match `APP_URL` exactly, character for character)
3. Put the client id and secret in `.env`, and set `APP_URL`
4. On the OAuth consent screen, the `email`, `profile` and `openid` scopes are
   all this needs — no verification review required for those

The flow is the standard authorization code exchange with PKCE, written out in
`src/lib/google.ts` rather than delegated to an auth library: the app already has
its own session, read by `getCurrentUser` in eighteen places, and adopting
Auth.js would have meant taking its session layer too. What that code checks, and
why each check is there:

| Check | Without it |
| --- | --- |
| `state` cookie matches the callback | A forged callback URL could sign somebody in |
| PKCE `code_verifier` | An intercepted code could be redeemed by someone else |
| `nonce` inside the ID token | A token minted for another session would pass |
| Signature against Google's JWKS, plus issuer and audience | The ID token is just JSON anyone can write |
| `email_verified === true` | Someone could claim an address they don't own and take over the matching account |

Accounts are matched on Google's subject id, not the email address, since an
address can be renamed or change hands. Signing in with Google using the address
of an existing password account links the two rather than making a second one;
that is only safe because of the `email_verified` check above.

## Anywhere in the world

A court is a physical place, so a match carries its city, country, position and
IANA time zone. `startsAt` is stored as an absolute instant, and the host enters
wall-clock time at the court — `src/lib/time.ts` converts between the two, so a
match posted in Tokyo reads as 07:00 JST whether it is browsed from Berlin or
from the server. Fees are quoted in the currency the court bills in, including
zero-decimal ones like JPY.

Nobody is ever asked what time zone they are in. It is derived on the server from
the court's coordinates (`tz-lookup`), and for a court typed in by hand, from the
city geocoded first. Getting this wrong by trusting the browser's zone would put
a Barcelona match an hour out for everyone reading it from London.

## Location and the map

On a first visit the page asks — in the page, before the browser's own prompt —
whether to use the visitor's position. Coordinates go to the server, which names
the city and stores both in an httpOnly cookie; the position itself never reaches
a third party from the browser.

- **Allowed** — the list narrows to matches within 100 km, each showing its
  distance, with "Show everywhere" always available
- **Declined** — remembered, so it stops asking, and the full list is shown

When hosting, "Pick a court on the map" opens a real map — streets, water, parks,
place names — on which the only marked points are tennis courts. The basemap is
CARTO Positron precisely because it draws no points of interest of its own: no
shops, no libraries, no civic buildings competing with the pins. Courts come from
OpenStreetMap and are drawn as ball pins, named ones carrying a label.

Choosing one fills in the court name, city, country and position, all of which
stay editable, and every field can still be typed by hand instead. Panning offers
"Search this area" rather than re-querying on every drag, which keeps the free
Overpass instances happy.

### External services

All free, no keys, all called from the server:

| Service | Used for | Notes |
| --- | --- | --- |
| Overpass API | finding tennis courts | public instances are often saturated; three mirrors are tried in turn |
| Nominatim | city names and city search | asks for a real User-Agent and light traffic — see `UA` in `src/lib/geo.ts` |
| CARTO Positron tiles | the basemap | chosen for having no POI icons; free for light use, commercial volume needs a CARTO plan |

None of them are suitable for production volume as-is. If this grows, move to a
hosted tile provider and either a paid geocoder or your own Nominatim.

## Stack

Next.js 16 (App Router + Server Actions), React 19, TypeScript, Tailwind v4, Prisma 7 + PostgreSQL.

There's no separate API layer — pages are Server Components that query the database directly, and writes go through Server Actions.

## Layout

```
prisma/schema.prisma      Data model: User / Match / Signup / Comment
prisma/seed.ts            Demo data
src/lib/prisma.ts         Prisma client (pg driver adapter)
src/lib/auth.ts           Session issuing and reading
src/lib/actions/          Server Actions: auth.ts / matches.ts
src/lib/format.ts         Display logic for NTRP, countries, levels and money
src/lib/time.ts           Time-zone conversion and formatting
src/lib/geo.ts            Courts, geocoding and coordinate to time-zone lookup
src/lib/location.ts       The visitor's stored position
src/app/api/              Court and place lookups used by the map picker
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

## Deploying to Vercel

The build command already runs `prisma migrate deploy` before `next build`, so a
fresh database gets its tables on first deploy.

| Variable | Value | Environments |
| --- | --- | --- |
| `DATABASE_URL` | A **pooled** Postgres connection string | Production, Preview |
| `AUTH_SECRET` | A fresh `openssl rand -base64 32` — never the development one | Production, Preview |
| `GOOGLE_CLIENT_ID` | From the Google console | Production |
| `GOOGLE_CLIENT_SECRET` | From the Google console | Production |
| `APP_URL` | `https://your-domain`, no trailing slash | Production |

Use the pooled connection string, not the direct one: every serverless instance
opens its own pool, and the direct endpoint runs out of connections quickly.

`APP_URL` is deliberately Production-only. Google requires each redirect URI to be
registered exactly, and Vercel gives every preview deployment a different
hostname — so Google sign-in cannot work on previews unless a preview gets a
stable alias domain that is registered too. Password sign-in still works there.

Register the production callback alongside the local one in the Google console:
`https://your-domain/api/auth/google/callback`.

`/api/courts` sets `maxDuration = 60` because Overpass is slow and the route
tries mirrors in turn; the default ten seconds is not enough.

## Before going live

- Replace `AUTH_SECRET` with a real random value; don't ship the development one
- There's no email verification or password reset, and no rate limiting — the login route wants some
- The `capacity` check runs inside a transaction; under Postgres' default Read Committed two people can still race for the last spot, so a unique constraint or `SELECT … FOR UPDATE` belongs there before this carries real traffic

## Possible next steps

Court search by distance or map, social sign-in, a waitlist when matches fill, no-show tracking and a reliability score, post-match ratings to calibrate NTRP, reminders before start time.
