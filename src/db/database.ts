import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'plexcritic.db')

export const db = new Database(dbPath)

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS movies (
    ratingKey TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    year INTEGER,
    dateAdded INTEGER,
    originallyAvailableAt TEXT,
    addedAt INTEGER,
    audioCodec TEXT,
    videoCodec TEXT,
    videoResolution TEXT,
    container TEXT,
    duration INTEGER,
    collections TEXT,
    coverPosterUrl TEXT
   )
`)

export const upsertMovie = db.prepare(`
  INSERT INTO movies (
    ratingKey,
    title,
    year,
    dateAdded,
    originallyAvailableAt,
    addedAt,
    audioCodec,
    videoCodec,
    videoResolution,
    container,
    duration,
    collections,
    coverPosterUrl
  ) VALUES (
    @ratingKey,
    @title,
    @year,
    @dateAdded,
    @originallyAvailableAt,
    @addedAt,
    @audioCodec,
    @videoCodec,
    @videoResolution,
    @container,
    @duration,
    @collections,
    @coverPosterUrl
  )
  ON CONFLICT(ratingKey) DO UPDATE SET
    audioCodec = excluded.audioCodec,
    videoCodec = excluded.videoCodec,
    videoResolution = excluded.videoResolution,
    container = excluded.container,
    collections = excluded.collections,
    coverPosterUrl = excluded.coverPosterUrl
`)

export function upsertMoviesBulk(movies: any[]) {
  const insertMany = db.transaction((movies) => {
    for (const movie of movies) {
      upsertMovie.run(movie)
    }
  })
  insertMany(movies)
  console.log(`Upserted ${movies.length} movies into the database.`)
  return true
}
