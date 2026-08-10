import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../database.js'
import { getFormatSummary, getTranscodeCandidates } from '../formatQueries.js'
import { defaultFormatPreferences, needsTranscode } from '../../config/formatPreferences.js'

function seedMedia(ratingKey: string, title: string, type: string = 'movie'): void {
  db.prepare(
    `INSERT INTO media (ratingKey, type, title, year, dateAdded, originallyAvailableAt,
      duration, libraryName, librarySectionKey, lastRefreshed, viewCount, lastViewedAt)
     VALUES (@ratingKey, @type, @title, 2020, 1700000000, '2020-01-01', 7200000,
      'Movies', '1', 1700000000, 0, 0)`,
  ).run({ ratingKey, type, title })
}

function seedFile(params: {
  id: number
  ratingKey: string
  videoCodec: string
  container: string
  videoResolution?: string
  file?: string
}): void {
  db.prepare(
    `INSERT INTO media_files (id, ratingKey, audioCodec, videoCodec, videoResolution,
      videoFrameRate, container, file)
     VALUES (@id, @ratingKey, 'aac', @videoCodec, @videoResolution, 24, @container, @file)`,
  ).run({
    id: params.id,
    ratingKey: params.ratingKey,
    videoCodec: params.videoCodec,
    container: params.container,
    videoResolution: params.videoResolution ?? '1080',
    file: params.file ?? `/media/${params.ratingKey}.mkv`,
  })
}

describe('needsTranscode', () => {
  it('returns false for preferred hevc/mkv', () => {
    expect(needsTranscode('hevc', 'mkv')).toBe(false)
  })

  it('returns true for h264 even in mkv', () => {
    expect(needsTranscode('h264', 'mkv')).toBe(true)
  })

  it('returns true for hevc in avi', () => {
    expect(needsTranscode('hevc', 'avi')).toBe(true)
  })

  it('returns false for audio-only (empty codec)', () => {
    expect(needsTranscode('', 'mp3')).toBe(false)
  })
})

describe('formatQueries', () => {
  beforeEach(() => {
    db.prepare(`DELETE FROM media_files`).run()
    db.prepare(`DELETE FROM media`).run()
  })

  it('summarizes codec/container/resolution breakdowns', () => {
    seedMedia('1', 'Good Encode')
    seedMedia('2', 'Old Encode')
    seedMedia('3', 'Track', 'track')
    seedFile({ id: 1, ratingKey: '1', videoCodec: 'hevc', container: 'mkv', videoResolution: '1080' })
    seedFile({ id: 2, ratingKey: '2', videoCodec: 'h264', container: 'avi', videoResolution: '720' })
    seedFile({
      id: 3,
      ratingKey: '3',
      videoCodec: '',
      container: 'mp3',
      videoResolution: '',
      file: '/music/t.mp3',
    })

    const summary = getFormatSummary()

    expect(summary.totalFiles).toBe(3)
    expect(summary.videoFiles).toBe(2)
    expect(summary.candidateCount).toBe(1)
    expect(summary.byCodec).toEqual(
      expect.arrayContaining([
        { value: 'hevc', count: 1 },
        { value: 'h264', count: 1 },
      ]),
    )
    expect(summary.byContainer).toEqual(
      expect.arrayContaining([
        { value: 'mkv', count: 1 },
        { value: 'avi', count: 1 },
      ]),
    )
    expect(summary.preferences.acceptableVideoCodecs).toEqual(
      defaultFormatPreferences.acceptableVideoCodecs,
    )
  })

  it('lists transcode candidates with reasons and respects limit/offset', () => {
    seedMedia('1', 'Alpha')
    seedMedia('2', 'Beta')
    seedMedia('3', 'Gamma')
    seedFile({ id: 1, ratingKey: '1', videoCodec: 'h264', container: 'mp4' })
    seedFile({ id: 2, ratingKey: '2', videoCodec: 'mpeg4', container: 'avi' })
    seedFile({ id: 3, ratingKey: '3', videoCodec: 'hevc', container: 'mkv' })

    const all = getTranscodeCandidates({ limit: 50, offset: 0 })
    expect(all).toHaveLength(2)
    expect(all.map((c) => c.title).sort()).toEqual(['Alpha', 'Beta'])
    expect(all[0]?.reason.length).toBeGreaterThan(0)

    const page = getTranscodeCandidates({ limit: 1, offset: 1 })
    expect(page).toHaveLength(1)
    expect(page[0]?.title).toBe('Beta')
  })
})
