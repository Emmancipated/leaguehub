# LeagueHub

A tournament management app for organizing leagues — groups, teams, players, fixtures, standings, and live match events — built with Next.js, TypeScript, PostgreSQL, and Prisma. Includes an admin console with fixture editing and CSV bulk imports.

## Features

- **Authentication**: email/password login issuing a signed JWT cookie; per-user roles (`SUPER_ADMIN`, `TOURNAMENT_ADMIN`, `REFEREE`, `TEAM_MANAGER`, `PLAYER`).
- **Tournaments**: create tournaments with group stages, teams, and players.
- **Scheduling**: generate fixtures, assign dates/venues/referees, and edit fixture details (date, venue, referee) directly from the match page.
- **Matches**: live scoring via match events (goals, own goals, cards, substitutions, penalties), with status progression (`SCHEDULED` → `LIVE` → `COMPLETED`).
- **Standings**: auto-computed league tables with configurable tie-breakers.
- **Admin console**: full management of tournaments, teams, players, fixtures, and matches.
- **Bulk import**: register many teams or players at once by uploading a CSV file (see [Bulk import](#bulk-import-teams--players)).

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript 5
- Prisma ORM 7 with the PostgreSQL driver adapter (`@prisma/adapter-pg`)
- PostgreSQL (docker-compose, postgres:17)
- Auth: [jose](https://github.com/panva/jose) (JWT HS256) cookie sessions
- Tailwind CSS
- bcryptjs for password hashing

## Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)

## Setup

### 1. Start the database

```bash
docker compose up -d
```

Runs PostgreSQL on port `5433` (the container maps `5433` → `5432`) with user/db `leaguehub`.

### 2. Configure environment

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL` — PostgreSQL connection string (defaults to the docker-compose DB).
- `AUTH_SECRET` — secret used to sign the `leaguehub_session` JWT cookie. Generate one:

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### 3. Install and prepare the database

```bash
npm install
npx prisma generate        # generate the Prisma client
npx prisma db push         # create/sync the schema in the local DB
npx prisma db seed         # seed the SUPER_ADMIN account
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Authentication / admin access

- **Login**: `POST /api/auth/login` with `{ email, password }` — sets the `leaguehub_session` cookie.
- **Seeded admin account**: `admin@leaguehub.local` / `Admin123!`.
- Admin routes under `/admin/...` are restricted to `SUPER_ADMIN` / `TOURNAMENT_ADMIN` roles. See `lib/auth/authorization.ts`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server (port 3000). |
| `npm run build` | Production build. |
| `npm run start` | Run the production server. |
| `npm run lint` | Run ESLint. |
| `npx prisma generate` | Generate the Prisma client. |
| `npx prisma db push` | Sync the schema to the database (dev). |
| `npx prisma db seed` | Seed the database (`prisma/seed.ts`). |
| `npx prisma studio` | Open Prisma Studio. |

## Bulk import (teams & players)

Register many records at once from CSV on the **Teams** and **Players** admin pages. Each row is created in its own transaction; failures are reported per row with the row number and a reason, and the rest of the file continues importing.

### Teams CSV

Required column: `name`. Optional: `shortName`, `logoUrl`, `group` (matched by group name).

```csv
name,shortName,logoUrl,group
Arsenal FC,ARS,https://example.com/ars.png,Group A
Chelsea FC,CHE,,Group B
```

### Players CSV

Required column: `firstName`. Optional: `lastName`, `displayName`, `jerseyNumber`, `dateOfBirth`, `phoneNumber`, `team` (matched by team name). A missing `lastName` defaults to an empty string.

```csv
firstName,lastName,displayName,jerseyNumber,dateOfBirth,phoneNumber,team
John,Smith,John "JD" Smith,10,1998-05-12,08012345678,Arsenal FC
Jane,Doe,JD,7,2000-03-08,,Chelsea FC
```

## Editing a fixture

On a match's detail page (`/admin/tournaments/{id}/matches/{matchId}`), the **Edit Fixture Details** form lets an admin update the scheduled date/time, venue, and referee. Status transitions and live event scoring are handled by the match actions and the event form respectively.

## Project structure

```
app/
  api/                                  # API route handlers (auth, tournaments, teams, players, matches)
  admin/tournaments/[id]/{...}          # Admin console
  tournaments/[slug]/...                # Public tournament views
lib/
  auth/                                 # JWT session + role-based authorization
  csv.ts                                # Quote-aware CSV parser (used by bulk import)
  prisma.ts                             # Prisma client (PostgreSQL driver adapter)
  validations/tournament.ts
  match-utils.ts
server/tournaments/                     # Tournament/team/player/match/standings services
components/                             # Shared UI components
prisma/
  schema.prisma                         # Data model
  seed.ts                               # Seeds the admin account
  migrations/                           # SQL migrations
```

## Notes

- The app uses Prisma's PostgreSQL driver adapter and expects a local Postgres container (see `docker-compose.yml`).
- `.env` is git-ignored — never commit real secrets.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [jose Documentation](https://github.com/panva/jose)
