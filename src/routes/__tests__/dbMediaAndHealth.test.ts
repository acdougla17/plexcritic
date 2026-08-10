import { describe, it, expect, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import dbRouter from '../db.js'
import healthRouter from '../healthCheck.js'
import { db } from '../../db/database.js'

function seedMedia(): void {
  db.prepare(`DELETE FROM sync_log`).run()
  db.prepare(`DELETE FROM media`).run()
  db.prepare(
    `INSERT INTO media (ratingKey, type, title, year, dateAdded, originallyAvailableAt,
      duration, libraryName, librarySectionKey, lastRefreshed, viewCount, lastViewedAt)
     VALUES ('1', 'movie', 'Test Movie', 2020, 1700000000, '2020-01-01', 1000,
      'Movies', '1', 1700000000, 0, 0)`,
  ).run()
  db.prepare(
    `INSERT INTO sync_log (ratingKey, lastSynced, logEntry)
     VALUES ('1', 1700000500, 'Upsert into: media')`,
  ).run()
}

describe('GET /db/media', () => {
  beforeEach(() => {
    seedMedia()
  })

  it('returns paginated media items', async () => {
    const app = express()
    app.use('/db', dbRouter)
    const res = await request(app).get('/db/media?search=Test&type=movie')

    expect(res.status).toBe(200)
    expect(res.body.total).toBe(1)
    expect(res.body.items[0].title).toBe('Test Movie')
  })
})

describe('GET /health/sync', () => {
  beforeEach(() => {
    seedMedia()
  })

  it('returns sync log summary', async () => {
    const app = express()
    app.use('/health', healthRouter)
    const res = await request(app).get('/health/sync')

    expect(res.status).toBe(200)
    expect(res.body.totalEntries).toBe(1)
    expect(res.body.recent[0].ratingKey).toBe('1')
  })
})
