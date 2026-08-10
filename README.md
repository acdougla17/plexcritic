# Plex Critic

A local companion for your Plex library. It syncs movies, shows, episodes, and music into its own SQLite database, then helps you understand what you own, what format it’s in, and what still needs converting — with a rule-based critic planned for what you actually watch versus what’s collecting dust.

> "I don't care what you own. I care what you actually watch."

## What it does

Plex Critic sits beside your Plex server and keeps a local copy of library metadata. From that copy you can:

- **Sync** library sections (movies, TV, music) into SQLite on demand
- **Browse** what’s in the local database without hammering Plex
- **Analyze formats** — codec, container, and resolution breakdowns, plus a transcode-candidate list based on your preferred formats
- **Operate** the tool from a React dashboard (library refresh, health, testing, analytics)

The longer-term critic will comment on watch/listen habits. Format and library health ship first so the data you care about for conversions is usable today.

## Stack

| Layer | Tech |
|---|---|
| API | TypeScript, Express 5, better-sqlite3, axios, dotenv |
| UI | React + Vite (TypeScript), light/dark themes (dark by default) |
| Tests | Vitest + Supertest (in-memory SQLite; never touches `plexcriticv2.db`) |

## Running it

```bash
npm install
npm run dev          # API on :3000 + Vite client on :5173 (proxied)
npm run dev:server   # API only
npm run dev:client   # Vite only
npm test             # unit + integration tests
npm run build        # compile API + build client into public/
npm start            # serve production build from dist/ + public/
```

Create a `.env` with `PLEX_URL`, `PLEX_PORT`, and `PLEX_TOKEN` for anything that talks to a real Plex server. Tests stub these via `src/test/setup.ts`.

Open the dashboard at [http://localhost:5173](http://localhost:5173) in development, or [http://localhost:3000](http://localhost:3000) after a production build.

## Dashboard sections

- **Library Management** — refresh Plex sections into the local DB; clear tables when you need a clean slate
- **Library Viewer** — search and filter what’s already synced
- **Testing** — hit raw Plex endpoints through the proxy
- **Health** — process uptime and recent sync activity
- **Analytics** — format breakdowns and transcode candidates
- **Critics Office** — placeholder for the upcoming rule-based critic

## Schema (high level)

```
media              — shared items (movies, shows, episodes, tracks)
movies / shows / episodes
media_files        — per-file specs (codec, resolution, container, path)
tags / media_tags  — genres, people, etc.
music_artists / music_albums / music_tracks
sync_log           — per-item sync history
critic_reviews     — scaffolded for the critic (not generating yet)
```

## Roadmap

What’s still ahead:

1. **Watch-behavior analytics** — never-watched rates, time-to-first-watch, added-vs-watched trends, top actors/directors — to feed the critic
2. **Critic engine** — rule-based commentary stored in `critic_reviews`, surfaced in Critics Office
3. **Format preference editor** — adjust acceptable codecs/containers from the UI (rules are code defaults today)
4. **Library Viewer polish** — richer filters, detail panes, music browsing depth
5. **Docker** — one-command local deploy

Built and usable now: Plex sync for movies/shows/music, SQLite schema, format analytics API, and the React dashboard shell with the six sections above.
