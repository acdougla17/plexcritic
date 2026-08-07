import { describe, it, expect, beforeEach } from 'vitest'
import { makeMovieItem, makeMovieLibraryResponse } from '../../test/fixtures.js'

// NOTE: src/test/setup.ts sets DB_PATH=':memory:' before this file (or any
// file that imports database.ts) runs, so `db` here is a fresh in-memory
// SQLite database with the real schema applied -- never your actual
// plexcriticv2.db on disk.
import { db, mapPlexMovies, upsertMovie, clearDatabase } from '../database.js'

beforeEach(() => {
  clearDatabase('ALL')
})

describe('upsertMovie', () => {
  it('inserts a new movie across media, movies, media_files, tags, and media_tags', () => {
    const mapped = mapPlexMovies(makeMovieLibraryResponse([makeMovieItem()]))
    const count = upsertMovie(mapped)

    expect(count.media).toBe(1)
    expect(count.movies).toBe(1)
    expect(count.media_files).toBe(1)

    const mediaRow = db.prepare('SELECT * FROM media WHERE ratingKey = ?').get('1') as any
    expect(mediaRow?.title).toBe('Test Movie')

    const movieRow = db.prepare('SELECT * FROM movies WHERE ratingKey = ?').get('1') as any
    expect(movieRow?.studio).toBe('Test Studio')

    const tagLinks = db
      .prepare(
        `SELECT t.tagType, t.name FROM media_tags mt
         JOIN tags t ON t.id = mt.tagId
         WHERE mt.ratingKey = ?`,
      )
      .all('1') as Array<{ tagType: string; name: string }>
    expect(tagLinks).toContainEqual({ tagType: 'director', name: 'Jane Director' })
    expect(tagLinks).toContainEqual({ tagType: 'genre', name: 'Drama' })
  })

  it('updates an existing movie on re-sync instead of duplicating the media row', () => {
    const original = mapPlexMovies(makeMovieLibraryResponse([makeMovieItem({ title: 'Original Title' })]))
    upsertMovie(original)

    const updated = mapPlexMovies(
      makeMovieLibraryResponse([makeMovieItem({ title: 'Updated Title' })]),
    )
    upsertMovie(updated)

    const rows = db.prepare('SELECT * FROM media WHERE ratingKey = ?').all('1')
    expect(rows).toHaveLength(1) // no duplicate row
    expect((rows[0] as any).title).toBe('Updated Title')
  })

  it('KNOWN BUG: re-syncing the same movie duplicates its media_files row (see roadmap Bug 3)', () => {
    const mapped = mapPlexMovies(makeMovieLibraryResponse([makeMovieItem()]))
    upsertMovie(mapped)
    upsertMovie(mapped) // re-sync, nothing changed

    const fileRows = db.prepare('SELECT * FROM media_files WHERE ratingKey = ?').all('1')
    expect(fileRows.length).toBe(1)
  })

  it('deduplicates a tag shared by multiple movies into a single tags row', () => {
    const movieA = mapPlexMovies(
      makeMovieLibraryResponse([makeMovieItem({ ratingKey: '1', Genre: [{ tag: 'Drama' }] })]),
    )
    const movieB = mapPlexMovies(
      makeMovieLibraryResponse([makeMovieItem({ ratingKey: '2', Genre: [{ tag: 'Drama' }] })]),
    )
    upsertMovie(movieA)
    upsertMovie(movieB)

    const dramaTagRows = db
      .prepare(`SELECT * FROM tags WHERE tagType = 'genre' AND name = 'Drama'`)
      .all()
    expect(dramaTagRows).toHaveLength(1)

    const links = db.prepare(`SELECT ratingKey FROM media_tags mt JOIN tags t ON t.id = mt.tagId WHERE t.name = 'Drama'`).all()
    expect(links).toHaveLength(2)
  })
})

describe('clearDatabase', () => {
  it('removes all rows from every table when called with "ALL"', () => {
    upsertMovie(mapPlexMovies(makeMovieLibraryResponse([makeMovieItem()])))
    expect((db.prepare('SELECT COUNT(*) as c FROM media').get() as any).c).toBeGreaterThan(0)

    clearDatabase('ALL')

    for (const table of ['media', 'movies', 'media_files', 'tags', 'media_tags']) {
      const { c } = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as { c: number }
      expect(c).toBe(0)
    }
  })

  it('removes rows from a single named table without touching others', () => {
    upsertMovie(mapPlexMovies(makeMovieLibraryResponse([makeMovieItem()])))
    clearDatabase('media_files')

    const mediaFilesCount = (db.prepare('SELECT COUNT(*) as c FROM media_files').get() as any).c
    const mediaCount = (db.prepare('SELECT COUNT(*) as c FROM media').get() as any).c
    expect(mediaFilesCount).toBe(0)
    expect(mediaCount).toBeGreaterThan(0)
  })
})
