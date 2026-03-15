import Database from 'better-sqlite3'
import path from 'path'
import type { Movies, Shows } from '../types/database.js'
import type { PlexLibraryItemResponse, PlexLibraryItem } from '../types/plex.js'
import fs from 'fs'
import * as Queries from './databaseQueries.js'

type TagRow = {
  id: number
}

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
const upsertTags = db.prepare(Queries.getUpsertTagsQuery())
const upsertMediaTags = db.prepare(Queries.getUpsertMediaTagsQuery())
const getTagId = db.prepare(Queries.getTagId())

// Create table if it doesn't exist
// db.exec(`
//   CREATE TABLE IF NOT EXISTS movies (
//     ratingKey TEXT PRIMARY KEY,
//     title TEXT NOT NULL,
//     year INTEGER,
//     dateAdded INTEGER,
//     originallyAvailableAt TEXT,
//     genres TEXT,
//     countries TEXT,
//     directors TEXT,
//     writers TEXT,
//     actors TEXT,
//     studio TEXT,
//     contentRating TEXT,
//     contentRatingAge INTEGER,
//     audienceRating REAL,
//     tagLine TEXT,
//     addedAt INTEGER,
//     audioCodec TEXT,
//     videoCodec TEXT,
//     videoResolution TEXT,
//     videoFrameRate TEXT,
//     container TEXT,
//     duration INTEGER,
//     collections TEXT,
//     coverPosterUrl TEXT,
//     file TEXT,
//     lastRefreshed INTEGER,
//     libraryName TEXT,
//     librarySectionKey TEXT
//    )
// `)

// export const upsertMovie = db.prepare(`
//   INSERT INTO movies (
//     ratingKey,
//     title,
//     year,
//     dateAdded,
//     originallyAvailableAt,
//     genres,
//     countries,
//     directors,
//     writers,
//     actors,
//     studio,
//     contentRating,
//     contentRatingAge,
//     audienceRating,
//     tagLine,
//     addedAt,
//     audioCodec,
//     videoCodec,
//     videoResolution,
//     videoFrameRate,
//     container,
//     duration,
//     collections,
//     coverPosterUrl,
//     file,
//     lastRefreshed,
//     libraryName,
//     librarySectionKey
//   ) VALUES (
//     @ratingKey,
//     @title,
//     @year,
//     @dateAdded,
//     @originallyAvailableAt,
//     @genres,
//     @countries,
//     @directors,
//     @writers,
//     @actors,
//     @studio,
//     @contentRating,
//     @contentRatingAge,
//     @audienceRating,
//     @tagLine,
//     @addedAt,
//     @audioCodec,
//     @videoCodec,
//     @videoResolution,
//     @videoFrameRate,
//     @container,
//     @duration,
//     @collections,
//     @coverPosterUrl,
//     @file,
//     @lastRefreshed,
//     @libraryName,
//     @librarySectionKey
//   )
//   ON CONFLICT(ratingKey) DO UPDATE SET
//     title = excluded.title,
//     year = excluded.year,
//     dateAdded = excluded.dateAdded,
//     originallyAvailableAt = excluded.originallyAvailableAt,
//     genres = excluded.genres,
//     countries = excluded.countries,
//     directors = excluded.directors,
//     writers = excluded.writers,
//     actors = excluded.actors,
//     studio = excluded.studio,
//     contentRating = excluded.contentRating,
//     contentRatingAge = excluded.contentRatingAge,
//     audienceRating = excluded.audienceRating,
//     tagLine = excluded.tagLine,
//     addedAt = excluded.addedAt,
//     audioCodec = excluded.audioCodec,
//     videoCodec = excluded.videoCodec,
//     videoResolution = excluded.videoResolution,
//     videoFrameRate = excluded.videoFrameRate,
//     container = excluded.container,
//     duration = excluded.duration,
//     collections = excluded.collections,
//     coverPosterUrl = excluded.coverPosterUrl,
//     file = excluded.file,
//     lastRefreshed = excluded.lastRefreshed,
//     libraryName = excluded.libraryName,
//     librarySectionKey = excluded.librarySectionKey
// `)

/************TODO************
 - Delete stuff missing from sync
 - Make sync engine
 - Make mapper functions from Plex to DB
*****************************/

export function upsertMovie(movie: PlexLibraryItem) {
  // TODO Map to DB fields

  // Insert into DB tables
  upsertMedia.run(movie)
  upsertMovies.run(movie)
  upsertMediaFiles.run(movie)
  syncAllTagsFromPlexItem(movie)
}

function syncAllTagsFromPlexItem(item: any) {
  for (const [key, value] of Object.entries(item)) {
    if (
      !Array.isArray(value) ||
      !value.length ||
      typeof value[0] !== 'object' ||
      !('tag' in value[0])
    ) {
      continue
    }

    const tagType = key.toLowerCase()
    const tags = value.map((v: any) => v.tag)
    syncTags(item.ratingKey, tagType, tags)
  }
}

function syncTags(ratingKey: string, tagType: string, tags: string[]) {
  for (const tag of tags) {
    upsertTags.run(tagType, tag)
    const row = getTagId.get(tagType, tag) as TagRow | undefined

    if (row) {
      upsertMediaTags.run(ratingKey, row.id)
    }
  }
}

export function upsertMoviesBulk(movies: any[]) {
  const insertMany = db.transaction((movies) => {
    for (const movie of movies) {
      upsertMedia.run(movie)
      upsertMovies.run(movie)
    }
  })
  insertMany(movies)
  console.log(`Upserted ${movies.length} movies into the database.`)
  return true
}

// db.exec(`
//   CREATE TABLE IF NOT EXISTS shows (
//     ratingKey TEXT PRIMARY KEY,
//     title TEXT NOT NULL,
//     year INTEGER,
//     dateAdded INTEGER,
//     originallyAvailableAt TEXT,
//     genres TEXT,
//     countries TEXT,
//     directors TEXT,
//     writers TEXT,
//     actors TEXT,
//     studio TEXT,
//     contentRating TEXT,
//     contentRatingAge INTEGER,
//     audienceRating REAL,
//     tagLine TEXT,
//     addedAt INTEGER,
//     audioCodec TEXT,
//     videoCodec TEXT,
//     videoResolution TEXT,
//     videoFrameRate TEXT,
//     container TEXT,
//     duration INTEGER,
//     collections TEXT,
//     coverPosterUrl TEXT,
//     file TEXT,
//     lastRefreshed INTEGER,
//     libraryName TEXT,
//     librarySectionKey TEXT
//    )
// `)

// export const upsertShow = db.prepare(`
//   INSERT INTO shows (
//     ratingKey,
//     title,
//     year,
//     dateAdded,
//     originallyAvailableAt,
//     genres,
//     countries,
//     directors,
//     writers,
//     actors,
//     studio,
//     contentRating,
//     contentRatingAge,
//     audienceRating,
//     tagLine,
//     addedAt,
//     audioCodec,
//     videoCodec,
//     videoResolution,
//     videoFrameRate,
//     container,
//     duration,
//     collections,
//     coverPosterUrl,
//     file,
//     lastRefreshed,
//     libraryName,
//     librarySectionKey
//   ) VALUES (
//     @ratingKey,
//     @title,
//     @year,
//     @dateAdded,
//     @originallyAvailableAt,
//     @genres,
//     @countries,
//     @directors,
//     @writers,
//     @actors,
//     @studio,
//     @contentRating,
//     @contentRatingAge,
//     @audienceRating,
//     @tagLine,
//     @addedAt,
//     @audioCodec,
//     @videoCodec,
//     @videoResolution,
//     @videoFrameRate,
//     @container,
//     @duration,
//     @collections,
//     @coverPosterUrl,
//     @file,
//     @lastRefreshed,
//     @libraryName,
//     @librarySectionKey
//   )
//   ON CONFLICT(ratingKey) DO UPDATE SET
//     title = excluded.title,
//     year = excluded.year,
//     dateAdded = excluded.dateAdded,
//     originallyAvailableAt = excluded.originallyAvailableAt,
//     genres = excluded.genres,
//     countries = excluded.countries,
//     directors = excluded.directors,
//     writers = excluded.writers,
//     actors = excluded.actors,
//     studio = excluded.studio,
//     contentRating = excluded.contentRating,
//     contentRatingAge = excluded.contentRatingAge,
//     audienceRating = excluded.audienceRating,
//     tagLine = excluded.tagLine,
//     addedAt = excluded.addedAt,
//     audioCodec = excluded.audioCodec,
//     videoCodec = excluded.videoCodec,
//     videoResolution = excluded.videoResolution,
//     videoFrameRate = excluded.videoFrameRate,
//     container = excluded.container,
//     duration = excluded.duration,
//     collections = excluded.collections,
//     coverPosterUrl = excluded.coverPosterUrl,
//     file = excluded.file,
//     lastRefreshed = excluded.lastRefreshed,
//     libraryName = excluded.libraryName,
//     librarySectionKey = excluded.librarySectionKey
// `)

export function upsertShowsBulk(shows: any[]) {
  const insertMany = db.transaction((shows) => {
    for (const show of shows) {
      upsertShows.run(show)
    }
  })
  insertMany(shows)
  console.log(`Upserted ${shows.length} shows into the database.`)
  return true
}

export async function updateAllShowsInSection(
  allItems: PlexLibraryItemResponse,
): Promise<boolean> {
  try {
    if (allItems.MediaContainer.viewGroup === 'show') {
      //   const shows: Shows[] = allItems.MediaContainer.Metadata.map((item) => ({
      //     ratingKey: item.ratingKey,
      //     title: item.title,
      //     year: item.year,
      //     dateAdded: item.addedAt,
      //     originallyAvailableAt: item.originallyAvailableAt,
      //     genres: item.Genre ? item.Genre.map((g: any) => g.tag).join(', ') : '',
      //     countries: item.Country
      //       ? item.Country.map((c: any) => c.tag).join(', ')
      //       : '',
      //     directors: item.Director
      //       ? item.Director.map((d: any) => d.tag).join(', ')
      //       : '',
      //     writers: item.Writer
      //       ? item.Writer.map((w: any) => w.tag).join(', ')
      //       : '',
      //     actors: item.Role ? item.Role.map((r: any) => r.tag).join(', ') : '',
      //     studio: item.studio ?? '',
      //     contentRating: item.contentRating ?? '',
      //     contentRatingAge: item.contentRatingAge ?? 0,
      //     audienceRating: item.audienceRating ?? 0,
      //     tagLine: item.tagline ?? '',
      //     addedAt: item.addedAt,
      //     //lastViewedAt: 0, // item.lastViewedAt,
      //     //playCount: 0, // item.playCount,
      //     audioCodec: item.Media[0].audioCodec,
      //     videoCodec: item.Media[0].videoCodec,
      //     videoResolution: item.Media[0].videoResolution,
      //     videoFrameRate: item.Media[0].videoFrameRate,
      //     container: item.Media[0].container,
      //     duration: item.Media[0].duration,
      //     collections: item.Collection
      //       ? item.Collection.map((c) => c.tag).join(', ')
      //       : '',
      //     coverPosterUrl: item.thumb ?? '',
      //     //file: item.Media[0].Part[0].file,
      //     file: getAllEpisodesForShow(item.ratingKey),
      //     lastRefreshed: Date.now(),
      //     libraryName: allItems.MediaContainer.librarySectionTitle,
      //     librarySectionKey: allItems.MediaContainer.librarySectionID.toString(),
      //   }))
      //   upsertShowsBulk(shows)
    }
    return true
  } catch (err: unknown) {
    console.error(`Error upserting items in section ${allItems}:`, err)
    throw err
  }
}

function mapPlexMovie(
  plexMovie: PlexLibraryItem,
  libraryName: string,
  librarySectionKey: string,
) {
  let mediaFiles = []
  for (const mediaItem of plexMovie.Media) {
    mediaFiles.push({
      ratingKey: plexMovie.ratingKey,
      type: plexMovie.type,
      title: plexMovie.title,
      year: plexMovie.year,
      dateAdded: plexMovie.addedAt,
      originallyAvailableAt: plexMovie.originallyAvailableAt,
      duration: plexMovie.duration,
      libraryName: libraryName,
      librarySectionKey: librarySectionKey,
      lastRefreshed: plexMovie.updatedAt,
    })
  }
  return {
    media: {
      ratingKey: plexMovie.ratingKey,
      type: plexMovie.type,
      title: plexMovie.title,
      year: plexMovie.year,
      dateAdded: plexMovie.addedAt,
      originallyAvailableAt: plexMovie.originallyAvailableAt,
      duration: plexMovie.duration,
      libraryName: libraryName,
      librarySectionKey: librarySectionKey,
      //file: plexMovie.Media.,
      lastRefreshed: plexMovie.updatedAt,
    },
    movie: {
      ratingKey: plexMovie.ratingKey,
      studio: plexMovie.studio,
      tagline: plexMovie.tagline,
      contentRating: plexMovie.contentRating,
      contentRatingAge: plexMovie.contentRatingAge,
      audienceRating: plexMovie.audienceRating,
      coverPosterUrl: plexMovie.thumb,
    },
  }
}

export async function updateAllMoviesInSection(
  allItems: PlexLibraryItemResponse,
): Promise<boolean> {
  try {
    if (allItems.MediaContainer.viewGroup === 'movie') {
      // Loop through all movies and see if any of them have multiple media entries (e.g. different versions of the same movie) - if so, we want to upsert each media entry as a separate movie in the database with the same ratingKey but different file paths and metadata
      for (const item of allItems.MediaContainer.Metadata) {
        if (item.Media.length > 1) {
          console.warn(
            `Item ${item.title} has multiple media entries. This may indicate multiple versions of the same movie. Upserting each media entry as a separate movie in the database.`,
          )
        }
      }

      const media = {
        ratingKey: '',
        type: '',
        title: '',
        year: '',
        dateAdded: '',
        originallyAvailableAt: '',
        duration: '',
        libraryName: '',
        librarySectionKey: '',
        lastRefreshed: '',
      }

      const mediaFiles = {
        id: '',
        ratingKey: '',
        audioCodec: '',
        videoCodec: '',
        videoResolution: '',
        videoFrameRate: '',
        container: '',
        file: '',
      }

      const tags = {
        id: '',
        tagType: '',
        name: '',
      }

      const mediaTags = {
        ratingKey: '',
        tagId: '',
      }

      const movies: Movies[] = allItems.MediaContainer.Metadata.map((item) => ({
        ratingKey: item.ratingKey,
        title: item.title,
        year: item.year,
        dateAdded: item.addedAt,
        originallyAvailableAt: item.originallyAvailableAt,
        genres: item.Genre ? item.Genre.map((g: any) => g.tag).join(', ') : '',
        countries: item.Country
          ? item.Country.map((c: any) => c.tag).join(', ')
          : '',
        directors: item.Director
          ? item.Director.map((d: any) => d.tag).join(', ')
          : '',
        writers: item.Writer
          ? item.Writer.map((w: any) => w.tag).join(', ')
          : '',
        actors: item.Role ? item.Role.map((r: any) => r.tag).join(', ') : '',
        studio: item.studio ?? '',
        contentRating: item.contentRating ?? '',
        contentRatingAge: item.contentRatingAge ?? 0,
        audienceRating: item.audienceRating ?? 0,
        tagLine: item.tagline ?? '',
        addedAt: item.addedAt,
        //lastViewedAt: 0, // item.lastViewedAt,
        //playCount: 0, // item.playCount,
        audioCodec: item.Media[0].audioCodec,
        videoCodec: item.Media[0].videoCodec,
        videoResolution: item.Media[0].videoResolution,
        videoFrameRate: item.Media[0].videoFrameRate,
        container: item.Media[0].container,
        duration: item.Media[0].duration,
        collections: item.Collection
          ? item.Collection.map((c) => c.tag).join(', ')
          : '',
        coverPosterUrl: item.thumb ?? '',
        file: item.Media[0].Part[0].file,
        lastRefreshed: Date.now(),
        libraryName: allItems.MediaContainer.librarySectionTitle,
        librarySectionKey: allItems.MediaContainer.librarySectionID.toString(),
      }))

      upsertMoviesBulk(movies)
    }
    return true
  } catch (err: unknown) {
    console.error(`Error upserting items in section ${allItems}:`, err)
    throw err
  }
}
