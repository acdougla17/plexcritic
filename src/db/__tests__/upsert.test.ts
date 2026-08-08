import { describe, it, expect, beforeEach, vi } from 'vitest'
import { makeMovieItem, makeMovieLibraryResponse, makeArtistItem, makeArtistLibraryResponse, makeAlbumItem, makeTrackItem } from '../../test/fixtures.js'

// mapPlexMusic calls getChildrenForArtist() and getChildrenForAlbum(), so mock them
vi.mock('../../connectors/plex.js', () => ({
  getAllEpisodesForShow: vi.fn(),
  getChildrenForArtist: vi.fn(),
  getChildrenForAlbum: vi.fn(),
}))

// NOTE: src/test/setup.ts sets DB_PATH=':memory:' before this file (or any
// file that imports database.ts) runs, so `db` here is a fresh in-memory
// SQLite database with the real schema applied -- never your actual
// plexcriticv2.db on disk.
import { db, mapPlexMovies, upsertMovie, mapPlexMusic, upsertMusic, clearDatabase } from '../database.js'
import { makeAlbumLibraryResponse, makeTrackLibraryResponse } from '../../test/fixtures.js'
import { getChildrenForArtist, getChildrenForAlbum } from '../../connectors/plex.js'

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

describe('upsertMusic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts a new artist, album, and track across all music tables', async () => {
    const mockGetChildrenForArtist = getChildrenForArtist as any
    const mockGetChildrenForAlbum = getChildrenForAlbum as any

    mockGetChildrenForArtist.mockResolvedValue(
      makeAlbumLibraryResponse([makeAlbumItem()]),
    )
    mockGetChildrenForAlbum.mockResolvedValue(
      makeTrackLibraryResponse([makeTrackItem()]),
    )

    const mapped = await mapPlexMusic(makeArtistLibraryResponse([makeArtistItem()]))
    const count = upsertMusic(mapped)

    expect(count.music_artists).toBe(1)
    expect(count.music_albums).toBe(1)
    expect(count.music_tracks).toBe(1)
    expect(count.media).toBe(1)
    expect(count.media_files).toBe(1)

    const artistRow = db
      .prepare('SELECT * FROM music_artists WHERE id = ?')
      .get(100) as any
    expect(artistRow?.name).toBe('Test Artist')

    const albumRow = db
      .prepare('SELECT * FROM music_albums WHERE id = ?')
      .get(101) as any
    expect(albumRow?.title).toBe('Test Album')
    expect(albumRow?.artistId).toBe(100)

    const trackRow = db
      .prepare('SELECT * FROM music_tracks WHERE ratingKey = ?')
      .get('102') as any
    expect(trackRow?.artistId).toBe(100)
    expect(trackRow?.albumId).toBe(101)
    expect(trackRow?.trackNumber).toBe(1)
  })

  it('maintains foreign key integrity between artists, albums, and tracks', async () => {
    const mockGetChildrenForArtist = getChildrenForArtist as any
    const mockGetChildrenForAlbum = getChildrenForAlbum as any

    mockGetChildrenForArtist.mockResolvedValue(
      makeAlbumLibraryResponse([makeAlbumItem()]),
    )
    mockGetChildrenForAlbum.mockResolvedValue(
      makeTrackLibraryResponse([makeTrackItem()]),
    )

    const mapped = await mapPlexMusic(makeArtistLibraryResponse([makeArtistItem()]))
    upsertMusic(mapped)

    // Verify FK constraint is satisfied by querying the relationship
    const albumWithArtist = db
      .prepare(
        `
        SELECT a.id, a.title, ar.id as artistId, ar.name
        FROM music_albums a
        JOIN music_artists ar ON ar.id = a.artistId
        WHERE a.id = ?
      `,
      )
      .get(101) as any

    expect(albumWithArtist?.artistId).toBe(100)
    expect(albumWithArtist?.name).toBe('Test Artist')

    // Verify track to album FK
    const trackWithalbum = db
      .prepare(
        `
        SELECT t.*, a.title as albumTitle
        FROM music_tracks t
        JOIN music_albums a ON a.id = t.albumId
        WHERE t.ratingKey = ?
      `,
      )
      .get('102') as any

    expect(trackWithalbum?.albumTitle).toBe('Test Album')
  })

  it('handles multiple artists with the same name but different ratingKeys', async () => {
    const mockGetChildrenForArtist = getChildrenForArtist as any
    const mockGetChildrenForAlbum = getChildrenForAlbum as any

    const artist1 = makeArtistItem({ ratingKey: '100', title: 'Same Name' })
    const artist2 = makeArtistItem({ ratingKey: '110', title: 'Same Name' })

    mockGetChildrenForArtist.mockResolvedValueOnce(
      makeAlbumLibraryResponse([
        makeAlbumItem({ ratingKey: '101', parentRatingKey: '100' }),
      ]),
    )
    mockGetChildrenForArtist.mockResolvedValueOnce(
      makeAlbumLibraryResponse([
        makeAlbumItem({ ratingKey: '111', parentRatingKey: '110' }),
      ]),
    )
    mockGetChildrenForAlbum.mockResolvedValueOnce(
      makeTrackLibraryResponse([makeTrackItem()]),
    )
    mockGetChildrenForAlbum.mockResolvedValueOnce(
      makeTrackLibraryResponse([
        makeTrackItem({
          ratingKey: '112',
          parentRatingKey: '111',
          grandparentRatingKey: '110',
        }),
      ]),
    )

    const mapped = await mapPlexMusic(makeArtistLibraryResponse([artist1, artist2]))
    upsertMusic(mapped)

    const artists = db
      .prepare('SELECT id, name FROM music_artists ORDER BY id')
      .all() as Array<{ id: number; name: string }>
    expect(artists).toHaveLength(2)
    expect(artists.map((a) => a.id)).toEqual([100, 110])

    const albums = db
      .prepare('SELECT id, artistId, title FROM music_albums ORDER BY id')
      .all() as Array<{ id: number; artistId: number; title: string }>
    expect(albums).toHaveLength(2)
    expect(albums.some((a) => a.artistId === 100)).toBe(true)
    expect(albums.some((a) => a.artistId === 110)).toBe(true)
  })

  it('updates existing music records on re-sync without duplicating', async () => {
    const mockGetChildrenForArtist = getChildrenForArtist as any
    const mockGetChildrenForAlbum = getChildrenForAlbum as any

    mockGetChildrenForArtist.mockResolvedValue(
      makeAlbumLibraryResponse([makeAlbumItem()]),
    )
    mockGetChildrenForAlbum.mockResolvedValue(
      makeTrackLibraryResponse([makeTrackItem()]),
    )

    // First sync
    const mapped1 = await mapPlexMusic(
      makeArtistLibraryResponse([makeArtistItem()]),
    )
    upsertMusic(mapped1)

    vi.clearAllMocks()
    mockGetChildrenForArtist.mockResolvedValue(
      makeAlbumLibraryResponse([
        makeAlbumItem({ year: 2021 }), // Updated year
      ]),
    )
    mockGetChildrenForAlbum.mockResolvedValue(
      makeTrackLibraryResponse([makeTrackItem()]),
    )

    // Second sync with updates
    const mapped2 = await mapPlexMusic(
      makeArtistLibraryResponse([makeArtistItem()]),
    )
    upsertMusic(mapped2)

    const albumRow = db
      .prepare('SELECT * FROM music_albums WHERE id = ?')
      .get(101) as any
    expect(albumRow?.year).toBe(2021)

    // Verify no duplicates created
    const albumCount = (db.prepare('SELECT COUNT(*) as c FROM music_albums').get() as any).c
    expect(albumCount).toBe(1)
  })

  it('creates proper media and media_files records for tracks', async () => {
    const mockGetChildrenForArtist = getChildrenForArtist as any
    const mockGetChildrenForAlbum = getChildrenForAlbum as any

    mockGetChildrenForArtist.mockResolvedValue(
      makeAlbumLibraryResponse([makeAlbumItem()]),
    )
    mockGetChildrenForAlbum.mockResolvedValue(
      makeTrackLibraryResponse([makeTrackItem()]),
    )

    const mapped = await mapPlexMusic(makeArtistLibraryResponse([makeArtistItem()]))
    upsertMusic(mapped)

    const mediaRow = db
      .prepare('SELECT * FROM media WHERE ratingKey = ?')
      .get('102') as any
    expect(mediaRow?.title).toBe('Test Song')
    expect(mediaRow?.type).toBe('track')
    expect(mediaRow?.libraryName).toBe('Music')

    const fileRow = db
      .prepare('SELECT * FROM media_files WHERE ratingKey = ?')
      .get('102') as any
    expect(fileRow?.audioCodec).toBe('mp3')
    expect(fileRow?.file).toContain('Test Song')
  })
})

