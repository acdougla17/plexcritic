export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res: Response = await fetch(url)
  if (!res.ok) {
    const body: string = await res.text()
    throw new ApiError(res.status, `${res.status} ${res.statusText}: ${body}`)
  }

  const contentType: string | null = res.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return (await res.json()) as T
  }

  const text: string = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

export type LibrarySection = {
  key: string
  title: string
  type?: string
}

export type LibrariesResponse = {
  movies: LibrarySection[]
  shows: LibrarySection[]
  music: LibrarySection[]
  other: LibrarySection[]
}

export type DbStats = Record<string, number>

export type MediaListResponse = {
  total: number
  limit: number
  offset: number
  items: Array<{
    ratingKey: string
    type: string
    title: string
    year: number | null
    libraryName: string | null
    dateAdded: number | null
    viewCount: number | null
    lastViewedAt: number | null
  }>
}

export type HealthResponse = {
  uptime: number
  message: string
  timestamp: number
}

export type SyncHealthResponse = {
  totalEntries: number
  latestSyncedAt: number | null
  recent: Array<{
    id: number
    ratingKey: string | null
    lastSynced: number | null
    logEntry: string | null
  }>
}

export type FormatSummary = {
  totalFiles: number
  videoFiles: number
  candidateCount: number
  candidatePercent: number
  byCodec: Array<{ value: string; count: number }>
  byContainer: Array<{ value: string; count: number }>
  byResolution: Array<{ value: string; count: number }>
  preferences: {
    acceptableVideoCodecs: string[]
    acceptableContainers: string[]
    acceptableResolutions: string[]
  }
}

export type CandidatesResponse = {
  limit: number
  offset: number
  count: number
  candidates: Array<{
    id: number
    ratingKey: string
    title: string
    type: string
    videoCodec: string | null
    container: string | null
    videoResolution: string | null
    file: string | null
    reason: string
  }>
}
