import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../database.js'
import { listMedia, getSyncHealth } from '../mediaQueries.js'

describe('mediaQueries', () => {
  beforeEach(() => {
    db.prepare(`DELETE FROM sync_log`).run()
    db.prepare(`DELETE FROM media`).run()

    db.prepare(
      `INSERT INTO media (ratingKey, type, title, year, dateAdded, originallyAvailableAt,
        duration, libraryName, librarySectionKey, lastRefreshed, viewCount, lastViewedAt)
       VALUES
         ('1', 'movie', 'Alpha Movie', 2020, 1700000000, '2020-01-01', 1000, 'Movies', '1', 1700000000, 0, 0),
         ('2', 'show', 'Beta Show', 2019, 1690000000, '2019-01-01', 0, 'TV', '2', 1690000000, 2, 1700000001),
         ('3', 'movie', 'Zeta Film', 2021, 1710000000, '2021-01-01', 2000, 'Movies', '1', 1710000000, 1, 1710000002)`,
    ).run()
  })

  it('lists media with search and type filters', () => {
    const all = listMedia({ limit: 50, offset: 0 })
    expect(all.total).toBe(3)

    const movies = listMedia({ type: 'movie', limit: 50, offset: 0 })
    expect(movies.total).toBe(2)
    expect(movies.items.every((i) => i.type === 'movie')).toBe(true)

    const search = listMedia({ search: 'beta', limit: 50, offset: 0 })
    expect(search.total).toBe(1)
    expect(search.items[0]?.title).toBe('Beta Show')
  })

  it('paginates media results', () => {
    const page = listMedia({ limit: 1, offset: 1 })
    expect(page.total).toBe(3)
    expect(page.items).toHaveLength(1)
    expect(page.items[0]?.title).toBe('Beta Show')
  })

  it('returns sync health from sync_log', () => {
    db.prepare(
      `INSERT INTO sync_log (ratingKey, lastSynced, logEntry)
       VALUES ('1', 1700000100, 'Upsert into: media'),
              ('2', 1700000200, 'Upsert into: shows')`,
    ).run()

    const health = getSyncHealth(10)
    expect(health.totalEntries).toBe(2)
    expect(health.latestSyncedAt).toBe(1700000200)
    expect(health.recent[0]?.ratingKey).toBe('2')
  })
})
