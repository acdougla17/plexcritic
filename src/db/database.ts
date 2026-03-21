import Database from 'better-sqlite3'
import path from 'path'
import type {
  Movie,
  Show,
  Episode,
  Media,
  MediaFiles,
  Tags,
  TagRow,
  MediaTagLink,
  MovieContainer,
  ShowContainer,
  SqLiteUpsertResp,
  SyncLog,
} from '../types/database.js'
import type { PlexLibraryItemResponse, PlexLibraryItem } from '../types/plex.js'
import fs from 'fs'
import * as Queries from './databaseQueries.js'
import { getAllEpisodesForShow } from '../connectors/plex.js'

// Load/Create dabase
const dbPath = path.join(process.cwd(), 'plexcriticv2.db')
export const db = new Database(dbPath)

// Load database schema
const schema = fs.readFileSync('./plexcriticv2.db.sql', 'utf8')
db.exec(schema)

// Prepare DB queries
const upsertMedia = db.prepare(Queries.getUpsertMediaQuery())
//const deleteMedia = db.prepare(Queries.getDeleteMediaQuery())
const upsertMediaFiles = db.prepare(Queries.getUpsertMediaFilesQuery())
const upsertMovies = db.prepare(Queries.getUpsertMoviesQuery())
const upsertShows = db.prepare(Queries.getUpsertShowsQuery())
const upsertEpisodes = db.prepare(Queries.getUpsertEpisodesQuery())
const upsertTags = db.prepare(Queries.getUpsertTagsQuery())
const upsertMediaTags = db.prepare<{ ratingKey: string; tagId: number }>(
  Queries.getUpsertMediaTagsQuery(),
)
const getTagId = db.prepare<{ tagType: string; tagName: string }, TagRow>(
  Queries.getTagId(),
)
const upsertSyncLog = db.prepare(Queries.getUpsertSyncLogQuery())

/************MAPPERS************
 * Map Plex data -> DB format
 *****************************/
export function mapPlexMovies(plexMovies: PlexLibraryItemResponse) {
  let moviesArr: Movie[] = []
  let mediaArr: Media[] = []
  let mediaFilesArr: MediaFiles[] = []
  let mediaTagLinks: MediaTagLink[] = []
  let tagsArr: Tags[] = []
  const movies = plexMovies.MediaContainer.Metadata
  const libraryName = plexMovies.MediaContainer.librarySectionTitle
  const librarySectionKey = plexMovies.MediaContainer.librarySectionID
  const tagSet = new Set<string>()

  // Loop through every movie passed into the mapper
  for (const movie of movies) {
    // For each movie, build a record and push it to moviesArr
    moviesArr.push({
      ratingKey: movie.ratingKey,
      studio: movie.studio ?? '',
      tagLine: movie.tagline ?? '',
      contentRating: movie.contentRating ?? '',
      contentRatingAge: movie.contentRatingAge ?? '',
      audienceRating: movie.audienceRating ?? '',
      coverPosterUrl:
        movie.Image?.find((img) => img.type === 'coverPoster')?.url ?? '',
    })

    // For each movie , build a media record (shared format between movies and tv) and push it to mediaArr
    mediaArr.push({
      ratingKey: movie.ratingKey,
      type: movie.type ?? 'other',
      title: movie.title ?? '',
      year: movie.year ?? 0,
      dateAdded: movie.addedAt ?? 0,
      originallyAvailableAt: movie.originallyAvailableAt ?? '',
      duration: movie.duration ?? 0,
      libraryName: libraryName,
      librarySectionKey: librarySectionKey.toString(),
      lastRefreshed: Date.now(),
    })

    // For each media section in a movie, build a media files record for each file and push it to mediaArr
    for (const media of movie.Media) {
      for (const file of media.Part) {
        mediaFilesArr.push({
          id: media.id,
          ratingKey: movie.ratingKey,
          audioCodec: media.audioCodec ?? '',
          videoCodec: media.videoCodec ?? '',
          videoResolution: media.videoResolution ?? '',
          videoFrameRate: media.videoFrameRate ?? '',
          container: media.container ?? '',
          file: file.file ?? '',
        })
      }
    }

    for (const [key, value] of Object.entries(movie)) {
      if (
        !Array.isArray(value) ||
        !value.length ||
        typeof value[0] !== 'object' ||
        !('tag' in value[0])
      ) {
        continue
      }

      const tagType = key.toLowerCase()

      for (const v of value as any[]) {
        const tagName = v.tag
        const uniqueKey = `${tagType}:${tagName}`

        // Deduplicate tags
        if (!tagSet.has(uniqueKey)) {
          tagSet.add(uniqueKey)

          tagsArr.push({
            tagType,
            name: tagName,
          })
        }

        // ALWAYS create relationship link
        mediaTagLinks.push({
          ratingKey: movie.ratingKey,
          tagType,
          tagName,
        })
      }
    }
  }
  return {
    moviesArr,
    mediaArr,
    mediaFilesArr,
    tagsArr,
    mediaTagLinks,
  }
}

export async function mapPlexShows(plexShows: PlexLibraryItemResponse) {
  let showsArr: Show[] = []
  let episodesArr: Episode[] = []
  let mediaArr: Media[] = []
  let mediaFilesArr: MediaFiles[] = []
  let tagsArr: Tags[] = []
  let mediaTagLinks: MediaTagLink[] = []
  const shows = plexShows.MediaContainer.Metadata
  const libraryName = plexShows.MediaContainer.librarySectionTitle
  const librarySectionKey = plexShows.MediaContainer.librarySectionID
  const tagSet = new Set<string>()

  // Loop through every show passed into the mapper
  for (const show of shows) {
    // Fetch all the episodes
    const episodesRes = await getAllEpisodesForShow(show.ratingKey)
    const episodes = episodesRes.MediaContainer.Metadata
    for (const episode of episodes) {
      // For each episode, build a record and push it to episodesArr
      episodesArr.push({
        ratingKey: episode.ratingKey,
        showRatingKey: show.ratingKey,
        seasonNumber: episode.index ?? 0,
        episodeNumber: episode.parentIndex ?? 0,
      })
      // For each movie , build a media record (shared format between movies and tv) and push it to mediaArr
      mediaArr.push({
        ratingKey: show.ratingKey,
        type: episode.type ?? 'other',
        title: episode.title ?? '',
        year: episode.year ?? 0,
        dateAdded: episode.addedAt ?? 0,
        originallyAvailableAt: episode.originallyAvailableAt ?? '',
        duration: episode.duration ?? 0,
        libraryName: libraryName,
        librarySectionKey: librarySectionKey.toString(),
        lastRefreshed: Date.now(),
      })

      // For each media section in a movie, build a media files record for each file and push it to mediaArr
      for (const media of episode.Media) {
        for (const file of media.Part) {
          mediaFilesArr.push({
            id: media.id,
            ratingKey: episode.ratingKey,
            audioCodec: media.audioCodec ?? '',
            videoCodec: media.videoCodec ?? '',
            videoResolution: media.videoResolution ?? '',
            videoFrameRate: media.videoFrameRate ?? '',
            container: media.container ?? '',
            file: file.file ?? '',
          })
        }
      }
      // Build out all of the tags associated to episode
      for (const [key, value] of Object.entries(episode)) {
        if (
          !Array.isArray(value) ||
          !value.length ||
          typeof value[0] !== 'object' ||
          !('tag' in value[0])
        ) {
          continue
        }

        const tagType = key.toLowerCase()

        for (const v of value as any[]) {
          const tagName = v.tag
          const uniqueKey = `${tagType}:${tagName}`

          // Deduplicate tags
          if (!tagSet.has(uniqueKey)) {
            tagSet.add(uniqueKey)

            tagsArr.push({
              tagType,
              name: tagName,
            })
          }

          // ALWAYS create relationship link
          mediaTagLinks.push({
            ratingKey: episode.ratingKey,
            tagType,
            tagName,
          })
        }
      }
    }

    // For each show, build a record and push it to showsArr
    showsArr.push({
      ratingKey: show.ratingKey,
      studio: show.studio ?? '',
      contentRating: show.contentRating ?? '',
      contentRatingAge: show.contentRatingAge ?? '',
      audienceRating: show.audienceRating ?? '',
      coverPosterUrl:
        show.Image?.find((img) => img.type === 'coverPoster')?.url ?? '',
    })

    // Build out all of the tags associated to show
    for (const [key, value] of Object.entries(show)) {
      if (
        !Array.isArray(value) ||
        !value.length ||
        typeof value[0] !== 'object' ||
        !('tag' in value[0])
      ) {
        continue
      }

      const tagType = key.toLowerCase()

      for (const v of value as any[]) {
        const tagName = v.tag
        const uniqueKey = `${tagType}:${tagName}`

        // Deduplicate tags
        if (!tagSet.has(uniqueKey)) {
          tagSet.add(uniqueKey)

          tagsArr.push({
            tagType,
            name: tagName,
          })
        }

        // ALWAYS create relationship link
        mediaTagLinks.push({
          ratingKey: show.ratingKey,
          tagType,
          tagName,
        })
      }
    }
  }
  return {
    showsArr,
    episodesArr,
    mediaArr,
    mediaFilesArr,
    tagsArr,
    mediaTagLinks,
  }
}

export function mapPlexEpisodes(plexEpisodes: PlexLibraryItemResponse) {
  let episodesArr: Episode[] = []
  let mediaArr: Media[] = []
  let mediaFilesArr: MediaFiles[] = []
  let tagsArr: Tags[] = []
  const episodes = plexEpisodes.MediaContainer.Metadata
  const libraryName = plexEpisodes.MediaContainer.librarySectionTitle
  const librarySectionKey = plexEpisodes.MediaContainer.librarySectionID

  // Loop through every episode passed into the mapper
  for (const episode of episodes) {
    // For each episode, build a record and push it to showsArr
    episodesArr.push({
      ratingKey: episode.ratingKey,
      showRatingKey: episode.grandparentRatingKey ?? '',
      seasonNumber: episode.parentIndex ?? 999,
      episodeNumber: episode.index ?? 999,
    })

    //For each show , build a media record (shared format between movies and tv) and push it to mediaArr
    mediaArr.push({
      ratingKey: episode.ratingKey,
      type: episode.type ?? '',
      title: episode.title ?? '',
      year: episode.year ?? 0,
      dateAdded: episode.addedAt ?? 0,
      originallyAvailableAt: episode.originallyAvailableAt ?? '',
      duration: episode.duration ?? 0,
      libraryName: libraryName,
      librarySectionKey: librarySectionKey.toString(),
      lastRefreshed: Date.now(),
    })

    //For each media section in a show, build a media files record for each file and push it to mediaArr
    for (const media of episode.Media) {
      for (const file of media.Part) {
        mediaFilesArr.push({
          id: media.id,
          ratingKey: episode.ratingKey,
          audioCodec: media.audioCodec ?? '',
          videoCodec: media.videoCodec ?? '',
          videoResolution: media.videoResolution ?? '',
          videoFrameRate: media.videoFrameRate ?? '',
          container: media.container ?? '',
          file: file.file ?? '',
        })
      }
    }

    const tagSet = new Set<string>()
    for (const [key, value] of Object.entries(episode)) {
      if (
        !Array.isArray(value) ||
        !value.length ||
        typeof value[0] !== 'object' ||
        !('tag' in value[0])
      ) {
        continue
      }

      const tagType = key.toLowerCase()

      for (const v of value as any[]) {
        const tagName = v.tag
        const uniqueKey = `${tagType}:${tagName}`

        // Deduplicate tags
        if (!tagSet.has(uniqueKey)) {
          tagSet.add(uniqueKey)

          tagsArr.push({
            tagType,
            name: tagName,
          })
        }
      }
    }
  }
  return {
    episodesArr,
    mediaArr,
    mediaFilesArr,
    tagsArr,
  }
}

/************LOGGERS************
 * Logs changes made to DB
 *****************************/
function syncLogUpsert(
  arr: Media[] | Show[] | Movie[] | MediaFiles[] | MediaTagLink[],
  table: string,
  results: SqLiteUpsertResp[],
) {
  if (!arr || arr.length === 0 || !results || results.length === 0) {
    return
  }
  try {
    const trx = db.transaction(() => {
      const logBatch: SyncLog[] = []
      for (const resultRow of results) {
        const arrIndex = resultRow.lastInsertRowid

        // Only create a log record if lastInsertRowid has a value because that means a change was made
        if (arrIndex != 0) {
          const logEntry = `Upsert into: ${table}`
          if (arr[arrIndex]?.ratingKey) {
            upsertSyncLog.run({
              ratingKey: arr[arrIndex]?.ratingKey,
              lastSynced: Date.now(),
              logEntry: logEntry,
            })
            logBatch.push({
              ratingKey: arr[arrIndex]?.ratingKey,
              lastSynced: Date.now(),
              logEntry: logEntry,
            })
          }
        }
      }
    })

    trx()
  } catch (err) {
    console.log('SyncLog Error: ', err)
    return
  }
  return
}

/************UPSERTERS************
 * Inserts data into DB tables
 *****************************/
export function upsertMovie(container: MovieContainer) {
  const { moviesArr, mediaArr, mediaFilesArr, tagsArr, mediaTagLinks } =
    container
  const count = {
    movies: moviesArr.length,
    media: mediaArr.length,
    media_files: mediaFilesArr.length,
    tags: tagsArr.length,
    media_tags: mediaTagLinks.length,
  }

  const trx = db.transaction(() => {
    // 1. Media
    try {
      const logData: SqLiteUpsertResp[] = []
      for (const m of mediaArr) {
        const r = upsertMedia.run(m)
        logData.push({
          changes: r.changes,
          lastInsertRowid: Number(r.lastInsertRowid),
        })
      }
      syncLogUpsert(mediaArr, 'media', logData)
    } catch (err) {
      console.error('Error when upserting to media table: ', err)
    }

    // 2. Movies
    try {
      const logData: SqLiteUpsertResp[] = []
      for (const m of moviesArr) {
        const r = upsertMovies.run(m)
        logData.push({
          changes: r.changes,
          lastInsertRowid: Number(r.lastInsertRowid),
        })
      }
      syncLogUpsert(moviesArr, 'movies', logData)
    } catch (err) {
      console.error('Error when upserting to movies table: ', err)
    }

    // 3. Media Files
    try {
      const logData: SqLiteUpsertResp[] = []
      for (const mf of mediaFilesArr) {
        const r = upsertMediaFiles.run(mf)
        logData.push({
          changes: r.changes,
          lastInsertRowid: Number(r.lastInsertRowid),
        })
      }
      syncLogUpsert(mediaFilesArr, 'media_files', logData)
    } catch (err) {
      console.error('Error when upserting to media_files table: ', err)
    }

    // 4. Tags
    try {
      for (const t of tagsArr) {
        upsertTags.run(t)
      }
    } catch (err) {
      console.error('Error when upserting to tags table: ', err)
    }

    // 5. Build + insert media_tags
    try {
      const logData: SqLiteUpsertResp[] = []
      for (const link of mediaTagLinks) {
        const row = getTagId.get({
          tagType: link.tagType,
          tagName: link.tagName,
        })
        if (row) {
          const r = upsertMediaTags.run({
            ratingKey: link.ratingKey,
            tagId: row.id,
          })
          logData.push({
            changes: r.changes,
            lastInsertRowid: Number(r.lastInsertRowid),
          })
        }
      }
      syncLogUpsert(mediaTagLinks, 'media_tags', logData)
    } catch (err) {
      console.error('Error when upserting to media_tags table: ', err)
    }
  })

  trx()
  return count
}

export function upsertShow(container: ShowContainer) {
  const {
    showsArr,
    episodesArr,
    mediaArr,
    mediaFilesArr,
    tagsArr,
    mediaTagLinks,
  } = container
  const count = {
    shows: showsArr.length,
    episodes: episodesArr.length,
    media: mediaArr.length,
    media_files: mediaFilesArr.length,
    tags: tagsArr.length,
    media_tags: mediaTagLinks.length,
  }

  const trx = db.transaction(() => {
    // 1. Media
    try {
      for (const m of mediaArr) {
        upsertMedia.run(m)
      }
    } catch (err) {
      console.error('Error when upserting to media table: ', err)
    }

    // 2. Shows
    try {
      for (const m of showsArr) {
        upsertShows.run(m)
      }
    } catch (err) {
      console.error('Error when upserting to shows table: ', err)
    }

    // 3. Episodes
    try {
      for (const m of episodesArr) {
        upsertEpisodes.run(m)
      }
    } catch (err) {
      console.error('Error when upserting to episodes table: ', err)
    }

    // 4. Media Files
    try {
      for (const mf of mediaFilesArr) {
        upsertMediaFiles.run(mf)
      }
    } catch (err) {
      console.error('Error when upserting to media_files table: ', err)
    }

    // 5. Tags
    try {
      for (const t of tagsArr) {
        upsertTags.run(t)
      }
    } catch (err) {
      console.error('Error when upserting to tags table: ', err)
    }

    // 6. Build + insert media_tags
    try {
      for (const link of mediaTagLinks) {
        const row = getTagId.get({
          tagType: link.tagType,
          tagName: link.tagName,
        })
        if (row) {
          upsertMediaTags.run({
            ratingKey: link.ratingKey,
            tagId: row.id,
          })
        }
      }
    } catch (err) {
      console.error('Error when upserting to media_tags table: ', err)
    }
  })

  trx()
  return count
}

/************REFRESHERS************
 * Refreshes data in library
 *****************************/
export async function refreshAllItemsInSection(
  allItems: PlexLibraryItemResponse,
): Promise<boolean> {
  try {
    let attempting = ''
    if (allItems.MediaContainer.viewGroup === 'movie') {
      upsertMovie(mapPlexMovies(allItems))
      attempting = `movies`
    } else if (allItems.MediaContainer.viewGroup === 'show') {
      //upsertShow(mapPlexShows(allItems))
      attempting = `shows`
    } else if (allItems.MediaContainer.viewGroup === 'artist') {
      //upsertMovie(mapPlexMovies(allItems))
      console.log('Music implementation is not ready yet')
      attempting = `music`
    } else {
      console.log('Other implementation is not ready yet')
      attempting = `other`
    }
    return true
  } catch (err: unknown) {
    console.error(`Error upserting items in section ${allItems}:`, err)
    throw err
  }
}

/************CLEANERS************
 * Cleans out dead data in library
 *****************************/
export function clearDatabase(tableName: string) {
  try {
    const trx = db.transaction(() => {
      if (tableName === 'ALL') {
        db.prepare(`DELETE FROM critic_reviews`).run()
        db.prepare(`DELETE FROM media_tags`).run()
        db.prepare(`DELETE FROM media_files`).run()
        db.prepare(`DELETE FROM episodes`).run()
        db.prepare(`DELETE FROM shows`).run()
        db.prepare(`DELETE FROM movies`).run()
        db.prepare(`DELETE FROM tags`).run()
        db.prepare(`DELETE FROM media`).run()
        db.prepare(`DELETE FROM sync_log`).run()
        db.prepare(`DELETE FROM music_tracks`).run()
        db.prepare(`DELETE FROM music_albums`).run()
        db.prepare(`DELETE FROM music_artists`).run()
        db.prepare(`DELETE FROM sqlite_sequence`).run()
      } else {
        db.prepare(`DELETE FROM ${tableName}`).run()
      }
    })

    trx()
  } catch (err) {
    console.error('Database cleanup error for table: ', tableName)
    return err
  }
  return 'DB has been cleared'
}

// TODO - Master refresh function
// TODO - Data cleaners
// TODO - Creating views
