<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# LeagueHub project notes

## Database connection
- Vercel Postgres injects `LEAGUEHUB_DATABASE_URL` (not `DATABASE_URL`).
- `lib/database-url.ts` exports `resolveDatabaseUrl()` with fallback chain: `DATABASE_URL` → `POSTGRES_URL`/`POSTGRES_PRISMA_URL` → `LEAGUEHUB_DATABASE_URL`/`LEAGUEHUB_POOL_DATABASE_URL` (prefix hardcoded `LEAGUEHUB`).
- `lib/prisma.ts` adds SSL `{ rejectUnauthorized: true }` for non-local hosts.

## Team logos
- Stored in Vercel Blob via `@vercel/blob` (`put(file, { access: "public" })`), public URL saved in `Team.logoUrl`. Never binary in PostgreSQL.
- Upload route: `app/api/admin/upload-logo/route.ts` (POST, multipart `file`).
- PATCH team logo URL: `app/api/admin/tournaments/[tournamentId]/teams/[teamId]/route.ts`.
- New Team form (`app/admin/tournaments/[tournamentId]/teams/new/page.tsx`) wires file upload → URL → POST team.
- `app/admin/tournaments/[tournamentId]/teams/[teamId]/_components/team-logo-uploader.tsx` handles change-logo for existing teams.

## Match events UI
- `app/tournaments/[slug]/matches/[matchId]/_components/live-match.tsx` renders events grouped by owning team side using module-level `TeamColumn`/`eventItem`/`minuteLabel` helpers (must NOT be defined inside render — eslint `react-hooks/static-components`).
- Events include `team` relation (select `id`, `name`, `shortName`, `logoUrl`).
- Each event is displayed on the side of its associated team (`event.team`): goals scored by Team A appear on Team A's side, yellow cards shown to Team B appear on Team B's side.
- For own goals (`type: "OWN_GOAL"`), the event is displayed on the benefiting team's side (the opposing team of the player who scored it), matching the scoring logic in the events API.
- Neutral side shows ONLY event times (minute labels) — never event details. If no events are neutral, the layout uses 2 columns; otherwise 3 (home / time / away).

