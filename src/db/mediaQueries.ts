import { db } from './database.js'

export type MediaListItem = {
  ratingKey: string
  type: string
  title: string
  year: number | null
  libraryName: string | null
  dateAdded: number | null
  viewCount: number | null
  lastViewedAt: number | null
}

export type MediaListResult = {
  total: number
  limit: number
  offset: number
  items: MediaListItem[]
}

export function listMedia(options: {
  search?: string
  type?: string
  limit?: number
  offset?: number
} = {}): MediaListResult {
  const limit: number = options.limit ?? 50
  const offset: number = options.offset ?? 0
  const search: string = (options.search ?? '').trim()
  const type: string = (options.type ?? '').trim()

  const whereParts: string[] = []
  const params: Record<string, string | number> = {
    limit,
    offset,
  }

  if (search.length > 0) {
    whereParts.push(`title LIKE @search`)
    params.search = `%${search}%`
  }

  if (type.length > 0 && type.toLowerCase() !== 'all') {
    whereParts.push(`type = @type`)
    params.type = type
  }

  const whereClause: string = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''

  const totalRow = db
    .prepare(`SELECT COUNT(*) AS count FROM media ${whereClause}`)
    .get(params) as { count: number } | undefined

  const items = db
    .prepare(
      `SELECT ratingKey, type, title, year, libraryName, dateAdded, viewCount, lastViewedAt
       FROM media
       ${whereClause}
       ORDER BY title ASC
       LIMIT @limit OFFSET @offset`,
    )
    .all(params) as MediaListItem[]

  return {
    total: totalRow?.count ?? 0,
    limit,
    offset,
    items,
  }
}

export type SyncLogEntry = {
  id: number
  ratingKey: string | null
  lastSynced: number | null
  logEntry: string | null
}

export type SyncHealth = {
  totalEntries: number
  recent: SyncLogEntry[]
  latestSyncedAt: number | null
}

export function getSyncHealth(limit: number = 25): SyncHealth {
  const safeLimit: number = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 25

  const totalRow = db.prepare(`SELECT COUNT(*) AS count FROM sync_log`).get() as
    | { count: number }
    | undefined

  const latestRow = db
    .prepare(`SELECT MAX(lastSynced) AS latestSyncedAt FROM sync_log`)
    .get() as { latestSyncedAt: number | null } | undefined

  const recent = db
    .prepare(
      `SELECT id, ratingKey, lastSynced, logEntry
       FROM sync_log
       ORDER BY lastSynced DESC, id DESC
       LIMIT ?`,
    )
    .all(safeLimit) as SyncLogEntry[]

  return {
    totalEntries: totalRow?.count ?? 0,
    recent,
    latestSyncedAt: latestRow?.latestSyncedAt ?? null,
  }
}
