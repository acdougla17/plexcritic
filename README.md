This project is to create a Plex critic that will analyze your collection like a pretentious movie buff friend looking through your shelves.

#How To Test
- npm run dev
- http://localhost:3000/

# Plex Critic — Project Roadmap)

*Stack: TypeScript, Express 5, better-sqlite3, axios, dotenv. Frontend: none yet.*

## 1. What's actually done vs. README

| Phase | README says | Reality |
|---|---|---|
| 1. Skeleton | DONE | Confirmed — Express app, route registry, home page listing endpoints |
| 2. Plex connection | DONE | Confirmed — `connectors/plex.ts` handles libraries, items, episodes, item details, tuners |
| 3. Fetch all items | In progress | **Movies: working end-to-end.** Shows/music: connector methods exist (`getAllEpisodesForShow`, etc.) and mapping logic (`mapPlexShows`) is written, but the actual upsert calls are commented out in `refreshAllItemsInSection` |
| 4. DB layer | DONE | Confirmed, and better than the README implies — see schema below |
| TODO: episode table | — | **Already done** — `episodes` table exists with `showRatingKey`, `seasonNumber`, `episodeNumber` |
| TODO: song table | — | **Already done** — `music_tracks`, `music_albums`, `music_artists` all exist (upsert logic not yet written though) |
| 5. Analytics module | Not started | Confirmed — no analytics queries anywhere in `databaseQueries.ts` |
| 6. Critic | Not started | Partially scaffolded — `critic_reviews` table exists in schema, and a query stub exists, but it's broken (see bugs below) and nothing calls it |
| 7. React frontend | Not started | Confirmed — no client code, `dist/` is just compiled server output |
| 8. Dockerize | Not started | Confirmed |

---

## 2. Bugs to fix before building analytics on this data

These matter because analytics and the critic engine will both read from these tables — better to fix now than debug weird stats later.

**Bug 1 — episode `media` rows are keyed to the wrong ratingKey.**
In `mapPlexShows` (`database.ts`), when building the `media` record for each episode, `ratingKey` is set to `show.ratingKey` instead of `episode.ratingKey`:
```ts
mediaArr.push({
  ratingKey: show.ratingKey,   // should be episode.ratingKey
  ...
})
```
But the `media_files` record for that same episode correctly uses `episode.ratingKey`. Since `episodes.ratingKey` has a foreign key to `media.ratingKey`, and `media_files.ratingKey` also has a foreign key to `media.ratingKey`, this mismatch means episode-level media rows would either collide with the show's own row or leave `media_files` pointing at a `ratingKey` that was never inserted into `media`. Worth fixing before turning shows/music sync back on.

**Bug 2 — `seasonNumber`/`episodeNumber` look swapped.**
Still in `mapPlexShows`:
```ts
episodesArr.push({
  ...
  seasonNumber: episode.index ?? 0,
  episodeNumber: episode.parentIndex ?? 0,
})
```
In Plex's API, `parentIndex` is conventionally the season number and `index` is the episode number within that season — so this looks reversed. Worth a quick check against a real Plex response before you re-enable show syncing, since "most frequent director" type stats will be fine either way, but any "S2E4" display in the frontend would be wrong.

**Bug 3 — `media_files` upsert will duplicate rows on every re-sync.**
```sql
INSERT INTO media_files (ratingKey, audioCodec, videoCodec, videoResolution, container, file)
VALUES (...)
ON CONFLICT(id) DO UPDATE SET ...
```
`id` isn't in the column list, so SQLite can't detect a conflict on it — every sync will insert a fresh row per file instead of updating the existing one. Since `id` is autoincrement, either add a natural unique constraint (e.g. `UNIQUE(ratingKey, file)`) and conflict on that, or look up the existing row's `id` before upserting.

**Bug 4 — `critic_reviews` upsert query is malformed.**
```sql
INSERT INTO critic_reviews (id, ratingKey, criticName, score, reviewText, reviewDate, category)
VALUES (@ratingKey, @criticName, @score, @reviewText @reviewDate, @category)
```
Column list has 7 entries, the VALUES list only binds 6 (missing comma after `@reviewText`), and it conflicts on `ratingKey` even though `ratingKey` has no unique constraint on that table (only `id` is a key, and it's autoincrement, not something you'd insert by hand). This one isn't wired up anywhere yet, so it hasn't bitten you — but it'll need a rewrite before phase 6.

None of these are urgent to fix today, but they're exactly the kind of thing that quietly poisons an "avg days to first watch" or "top director" stat, so I'd knock them out before phase 5.

---

## 3. Schema you already have (for reference)

```
media            — shared item table (movies + shows + episodes), keyed by ratingKey
movies           — movie-specific fields (studio, tagline, content rating, audience rating)
shows            — show-specific fields (same shape as movies)
episodes         — showRatingKey, seasonNumber, episodeNumber
media_files      — per-file technical specs (codec, resolution, frame rate, container, path)
tags             — deduplicated tag table (genre, director, actor, writer, etc. — tagType + name)
media_tags       — join table, ratingKey <-> tagId
music_artists / music_albums / music_tracks — present, upsert logic not yet written
sync_log         — per-ratingKey log of what got synced when
critic_reviews   — scaffolded, not yet wired up
```

The `tags` table already generalizes actor/director/writer/genre into one structure (`tagType` discriminates) — that's actually a cleaner design than what I proposed in the last draft of this roadmap, since it means "most frequent director" and "most frequent genre" are the same query shape with a different `tagType` filter. No redesign needed here — build analytics against what's already there.

One thing worth deciding: **`media` has no `viewCount`/`lastViewedAt` fields at all.** Your README's analytics list (never-watched %, avg days to first watch) needs Plex's watch-history data, which isn't in the schema yet. That's not a bug, just a gap — see phase 5 below.

---

## 4. Phase 3 — finish this first

Before analytics, turn the lights on for shows and music:

1. Fix bugs 1 and 2 above.
2. Uncomment `upsertShow(mapPlexShows(allItems))` in `refreshAllItemsInSection`.
3. Write the music mapper/upsert (mirroring `mapPlexMovies`/`upsertMovie`) — currently `mapPlexShows` exists but there's no `mapPlexMusic` yet, and the `artist` branch just logs "not ready."
4. Add `viewCount` and `lastViewedAt` to the `media` table (or fetch them separately) — Plex's `/library/sections/{key}/all` response includes `viewCount` and `lastViewedAt` per item already, so this may just mean adding two columns and two fields to the mapper, not a new API call.

## 5. Phase 5 — Analytics module (once phase 3 is solid)

With `viewCount`/`lastViewedAt` added, your README's queries map directly onto the existing schema:

**Total films**
```sql
SELECT COUNT(*) FROM media m JOIN movies mv ON mv.ratingKey = m.ratingKey;
```

**Never-watched %**
```sql
SELECT
  ROUND(100.0 * SUM(CASE WHEN viewCount = 0 THEN 1 ELSE 0 END) / COUNT(*), 1) AS pct
FROM media m JOIN movies mv ON mv.ratingKey = m.ratingKey;
```

**Most frequent director** (using the existing `tags` design)
```sql
SELECT t.name, COUNT(*) AS appearances
FROM media_tags mt
JOIN tags t ON t.id = mt.tagId
WHERE t.tagType = 'director'
GROUP BY t.id
ORDER BY appearances DESC
LIMIT 10;
```

Suggested new file: `src/db/analyticsQueries.ts`, following the same pattern as `databaseQueries.ts`, plus a `src/routes/analytics.ts` exposing them — consistent with how the rest of the codebase is organized (one queries file, one route file per concern).

## 6. Phase 5.5 — Media format module (your transcode goal — not in original README)

This is the piece that supports your "what should I convert" goal and it's *already fully supported by the schema* — `media_files` has `videoCodec`, `container`, `videoResolution` right now:

```sql
SELECT videoCodec, container, COUNT(*) AS count
FROM media_files
GROUP BY videoCodec, container
ORDER BY count DESC;
```
```sql
SELECT m.title, mf.container, mf.videoCodec, mf.videoResolution, mf.file
FROM media_files mf
JOIN media m ON m.ratingKey = mf.ratingKey
WHERE mf.videoCodec IN ('mpeg4', 'wmv3')  -- your "needs conversion" list
   OR mf.container = 'avi';
```
No schema changes needed here at all — this can be built in parallel with phase 5 since it doesn't depend on the viewCount addition.

## 7. Phase 6 — Critic engine

The `critic_reviews` table already anticipates storing generated reviews (with `criticName`, `score`, `category`) rather than generating them fresh every request — that's a reasonable design if you want review history over time. Given your rule-based approach:

- Fix the broken upsert query (bug 4) first.
- Build `src/critic/rules.ts` (condition → template array) similar to what I sketched before — this part of the plan doesn't change based on the repo review, since no critic code exists yet to react to.
- Decide: does `critic_reviews` get a new row every time you refresh (so you can see how your "taste profile" changes over months), or does it overwrite? The schema as written (autoincrement `id`, no unique constraint) suggests append-only was the original intent — worth confirming that's what you want before fixing the upsert.

## 8. Phases 7–8

Unchanged from before — React frontend and Dockerize are both genuinely un-started, and don't have any surprises to correct for. Once 5/5.5/6 expose clean JSON endpoints, frontend work is straightforward; Docker is low-risk once the app is feature-stable.

---

## 9. Suggested immediate order of operations

1. Fix bugs 1–3 (episode ratingKey, season/episode swap, media_files dedup).
2. Add `viewCount`/`lastViewedAt` to `media`, re-enable show sync, write music mapper.
3. Build phase 5.5 (media format module) — no blockers, quick win, directly serves your transcode goal.
4. Build phase 5 (analytics) now that watch data exists.
5. Fix bug 4, then build phase 6 (critic).
6. Frontend, then Docker.