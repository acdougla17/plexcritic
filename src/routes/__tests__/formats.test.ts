import { describe, it, expect, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import formatsRouter from '../formats.js'
import { db } from '../../db/database.js'

function buildTestApp() {
  const app = express()
  app.use('/formats', formatsRouter)
  return app
}

function seed(): void {
  db.prepare(`DELETE FROM media_files`).run()
  db.prepare(`DELETE FROM media`).run()

  db.prepare(
    `INSERT INTO media (ratingKey, type, title, year, dateAdded, originallyAvailableAt,
      duration, libraryName, librarySectionKey, lastRefreshed, viewCount, lastViewedAt)
     VALUES ('1', 'movie', 'Needs Work', 2020, 1700000000, '2020-01-01', 1000,
      'Movies', '1', 1700000000, 0, 0)`,
  ).run()

  db.prepare(
    `INSERT INTO media_files (id, ratingKey, audioCodec, videoCodec, videoResolution,
      videoFrameRate, container, file)
     VALUES (1, '1', 'aac', 'h264', '1080', 24, 'avi', '/movies/needs.avi')`,
  ).run()
}

describe('formats routes', () => {
  beforeEach(() => {
    seed()
  })

  it('GET /formats/summary returns breakdowns', async () => {
    const app = buildTestApp()
    const res = await request(app).get('/formats/summary')

    expect(res.status).toBe(200)
    expect(res.body.totalFiles).toBe(1)
    expect(res.body.candidateCount).toBe(1)
    expect(Array.isArray(res.body.byCodec)).toBe(true)
  })

  it('GET /formats/candidates returns candidate list', async () => {
    const app = buildTestApp()
    const res = await request(app).get('/formats/candidates?limit=10&offset=0')

    expect(res.status).toBe(200)
    expect(res.body.count).toBe(1)
    expect(res.body.candidates[0].title).toBe('Needs Work')
    expect(res.body.candidates[0].videoCodec).toBe('h264')
  })

  it('GET /formats/preferences returns defaults', async () => {
    const app = buildTestApp()
    const res = await request(app).get('/formats/preferences')

    expect(res.status).toBe(200)
    expect(res.body.acceptableVideoCodecs).toContain('hevc')
    expect(res.body.acceptableContainers).toContain('mkv')
  })
})
