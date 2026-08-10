# Plex Critic

A local tool that syncs your Plex library into its own SQLite database, then
analyzes it two ways: a **stats dashboard** (what you own, what format it's
in, what needs converting) and a **critic** (rule-based commentary on what
you've actually watched/listened to vs. what's sitting on the shelf).

> "I don't care what you own. I care what you actually watch."

## Stack

TypeScript, Express 5, better-sqlite3, axios, dotenv. Tests: Vitest + Supertest.
Frontend: a static HTML/JS dashboard served from `public/` — no framework yet.

## Running it

```
npm install
npm run dev      # http://localhost:3000/ — dashboard
npm test         # unit + integration tests (in-memory DB, never touches plexcriticv2.db)
npm run build    # tsc -> dist/
```

You'll need a `.env` with `PLEX_URL`, `PLEX_PORT`, and `PLEX_TOKEN` for anything
that talks to a real Plex server. Tests don't need this — `src/test/setup.ts`
stubs it out.

## Current status

Movies, shows/episodes, and music all sync end-to-end now — `refreshLibrary`
dispatches to `mapPlexMovies`/`mapPlexShows`/`mapPlexMusic` and their matching
upserters based on the section's `viewGroup`. The four bugs flagged in the
previous version of this doc (episode media rows keyed to the wrong
ratingKey, season/episode fields swapped, `media_files` duplicating rows on
re-sync, malformed `critic_reviews` upsert) are all fixed and covered by
regression tests.

The dashboard (`public/dashboard.html` + `dashboard.js`) currently has three
cards: DB table row counts, library refresh controls, and a raw
Plex-endpoint tester. It's served as static files via Express
(`app.use(express.static('public'))`) — see "Next: frontend" below for where
this is headed.

| Area | Status |
|---|---|
| Plex connection (movies/shows/episodes/music) | Done |
| DB schema + sync (movies/shows/episodes/music) | Done |
| Unit/integration tests | Done — 51 tests, Vitest, in-memory DB |
| Basic dashboard (stats, refresh, endpoint tester) | Done |
| Watch/listen stats in schema | Done |
| Analytics module | Not started |
| Media format / transcode-candidate module | Not started |
| Critic engine | Not started (table scaffolded, nothing generates reviews yet) |
| Dashboard sections (Library Mgmt/Viewer/Testing/Health/Analytics/Critics Office) | Not started |
| Docker | Not started |

## Schema

```
media            — shared item table (movies + shows + episodes + music tracks), keyed by ratingKey
movies           — movie-specific fields (studio, tagline, content rating, audience rating)
shows            — show-specific fields
episodes         — showRatingKey, seasonNumber, episodeNumber
media_files      — per-file technical specs (codec, resolution, frame rate, container, path)
tags             — deduplicated tag table (genre, director, actor, writer, etc. — tagType + name)
media_tags       — join table, ratingKey <-> tagId
music_artists / music_albums / music_tracks — synced now
sync_log         — per-ratingKey log of what got synced when
critic_reviews   — scaffolded, not yet wired up to anything
```

## Roadmap

### 1. Analytics module
New `src/db/analyticsQueries.ts` + `src/routes/analytics.ts`, following the
existing one-file-per-concern pattern. Queries against `media`/`movies`/
`tags`/`media_tags` for: total counts, never-watched %, avg days to first
watch, added-vs-watched by year, collection appearance counts, most frequent
actor/director/writer (all via `tags` filtered by `tagType`).

### 2. Media format module (your transcode goal)
No schema changes needed — `media_files` already has `videoCodec`,
`container`, `videoResolution`. New `src/routes/formats.ts`: breakdown by
codec/container, and a "transcode candidates" query against a small config
file defining what counts as an acceptable format for you.

### 3. Critic engine
Rule-based: a condition → template-string mapping fed by the analytics
output. `critic_reviews` table is ready to store generated reviews over time
(append-only looks like the intended design, given the autoincrement `id`
with no unique constraint — worth confirming that's still what you want).

### 4. Frontend — breaking the dashboard into sections
You want six sections:

- **Library Management** — refresh controls (what's already in the "Library
  Refresh" card), plus `db/remove`/`removeAll` cleanup controls.
- **Library Viewer** — browse what's actually in the DB: movies/shows/music
  tables, searchable/filterable, not just row counts.
- **Testing Section** — the existing raw-endpoint tester, unchanged.
- **Health Dashboard** — `/health` uptime, plus sync_log activity (last
  refresh per section, error counts) — a proper operational view rather than
  just "is the server up."
- **Analytics Dashboard** — format breakdown, transcode candidates, general
  library stats. Explicitly *not* watch-behavior or critic content, per your
  scope — this is the "what do I own and what state is it in" view, with
  adjustable settings (e.g. which codecs/containers count as "needs
  conversion").
- **Critics Office** — generated reviews/feedback once phase 4 exists.

Given the current dashboard is static HTML/JS with card-based sections
already, the natural next step is either (a) tabs/nav within the single
page swapping which card-group is visible, or (b) separate HTML pages per
section sharing `dashboard.js`'s fetch helpers. Worth deciding before
scaffolding — a tabbed single-page approach keeps shared state (like loaded
library list) in one place; separate pages are simpler individually but
duplicate some fetch logic.

## Testing

`npm test` runs everything against an in-memory SQLite DB (via `DB_PATH`
env var, see `src/config.ts`) — it never touches your real `plexcriticv2.db`.
See `src/db/__tests__/`, `src/connectors/__tests__/`, `src/routes/__tests__/`.
New features should get a test file alongside their module, following that
pattern.
