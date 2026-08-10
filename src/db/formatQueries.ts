import { db } from './database.js'
import {
  getFormatPreferences,
  needsTranscode,
  type FormatPreferences,
} from '../config/formatPreferences.js'

export type FormatCount = {
  value: string
  count: number
}

export type FormatSummary = {
  totalFiles: number
  videoFiles: number
  candidateCount: number
  candidatePercent: number
  byCodec: FormatCount[]
  byContainer: FormatCount[]
  byResolution: FormatCount[]
  preferences: FormatPreferences
}

export type TranscodeCandidate = {
  id: number
  ratingKey: string
  title: string
  type: string
  videoCodec: string | null
  container: string | null
  videoResolution: string | null
  file: string | null
  reason: string
}

type MediaFileRow = {
  id: number
  ratingKey: string
  title: string | null
  type: string | null
  videoCodec: string | null
  container: string | null
  videoResolution: string | null
  file: string | null
}

function countGrouped(column: 'videoCodec' | 'container' | 'videoResolution'): FormatCount[] {
  const rows = db
    .prepare(
      `SELECT COALESCE(NULLIF(TRIM(${column}), ''), '(unknown)') AS value, COUNT(*) AS count
       FROM media_files
       WHERE TRIM(COALESCE(videoCodec, '')) != ''
       GROUP BY value
       ORDER BY count DESC, value ASC`,
    )
    .all() as Array<{ value: string; count: number }>

  return rows.map((row: { value: string; count: number }) => ({
    value: row.value,
    count: row.count,
  }))
}

function candidateReason(
  videoCodec: string | null,
  container: string | null,
  preferences: FormatPreferences,
): string {
  const codec: string = (videoCodec ?? '').trim().toLowerCase()
  const cont: string = (container ?? '').trim().toLowerCase()
  const parts: string[] = []

  const codecOk: boolean = preferences.acceptableVideoCodecs.some(
    (c: string) => c.toLowerCase() === codec,
  )
  if (!codecOk) {
    parts.push(`codec ${codec || '(empty)'} not preferred`)
  }

  const containerOk: boolean =
    cont.length === 0 ||
    preferences.acceptableContainers.some((c: string) => c.toLowerCase() === cont)
  if (!containerOk) {
    parts.push(`container ${cont} not preferred`)
  }

  return parts.join('; ') || 'does not match preferences'
}

export function getFormatSummary(
  preferences: FormatPreferences = getFormatPreferences(),
): FormatSummary {
  const totalRow = db.prepare(`SELECT COUNT(*) AS count FROM media_files`).get() as
    | { count: number }
    | undefined
  const videoRow = db
    .prepare(
      `SELECT COUNT(*) AS count FROM media_files WHERE TRIM(COALESCE(videoCodec, '')) != ''`,
    )
    .get() as { count: number } | undefined

  const totalFiles: number = totalRow?.count ?? 0
  const videoFiles: number = videoRow?.count ?? 0

  const videoRows = db
    .prepare(
      `SELECT videoCodec, container FROM media_files WHERE TRIM(COALESCE(videoCodec, '')) != ''`,
    )
    .all() as Array<{ videoCodec: string | null; container: string | null }>

  let candidateCount: number = 0
  for (const row of videoRows) {
    if (needsTranscode(row.videoCodec, row.container, preferences)) {
      candidateCount += 1
    }
  }

  const candidatePercent: number =
    videoFiles === 0 ? 0 : Math.round((candidateCount / videoFiles) * 1000) / 10

  return {
    totalFiles,
    videoFiles,
    candidateCount,
    candidatePercent,
    byCodec: countGrouped('videoCodec'),
    byContainer: countGrouped('container'),
    byResolution: countGrouped('videoResolution'),
    preferences,
  }
}

export function getTranscodeCandidates(options: {
  limit?: number
  offset?: number
  preferences?: FormatPreferences
} = {}): TranscodeCandidate[] {
  const preferences: FormatPreferences = options.preferences ?? getFormatPreferences()
  const limit: number = options.limit ?? 100
  const offset: number = options.offset ?? 0

  const rows = db
    .prepare(
      `SELECT mf.id, mf.ratingKey, m.title, m.type, mf.videoCodec, mf.container,
              mf.videoResolution, mf.file
       FROM media_files mf
       LEFT JOIN media m ON m.ratingKey = mf.ratingKey
       WHERE TRIM(COALESCE(mf.videoCodec, '')) != ''
       ORDER BY m.title ASC, mf.id ASC`,
    )
    .all() as MediaFileRow[]

  const filtered: TranscodeCandidate[] = []
  for (const row of rows) {
    if (!needsTranscode(row.videoCodec, row.container, preferences)) {
      continue
    }
    filtered.push({
      id: row.id,
      ratingKey: row.ratingKey,
      title: row.title ?? '(unknown)',
      type: row.type ?? 'unknown',
      videoCodec: row.videoCodec,
      container: row.container,
      videoResolution: row.videoResolution,
      file: row.file,
      reason: candidateReason(row.videoCodec, row.container, preferences),
    })
  }

  return filtered.slice(offset, offset + limit)
}
