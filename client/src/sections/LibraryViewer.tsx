import { useEffect, useState } from 'react'
import { fetchJson, type MediaListResponse } from '../api/client'

export function LibraryViewer() {
  const [search, setSearch] = useState<string>('')
  const [type, setType] = useState<string>('all')
  const [data, setData] = useState<MediaListResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  async function load(offset: number = 0): Promise<void> {
    setLoading(true)
    setError(null)
    try {
      const params: URLSearchParams = new URLSearchParams()
      params.set('limit', '50')
      params.set('offset', String(offset))
      if (search.trim()) {
        params.set('search', search.trim())
      }
      if (type !== 'all') {
        params.set('type', type)
      }
      const result: MediaListResponse = await fetchJson<MediaListResponse>(
        `/db/media?${params.toString()}`,
      )
      setData(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(0)
  }, [])

  return (
    <div>
      <header className="section-header">
        <h2>Library Viewer</h2>
        <p>Browse what is already synced into the local database.</p>
      </header>

      <div className="panel">
        <div className="row">
          <div className="field">
            <label htmlFor="search">Search title</label>
            <input
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void load(0)
                }
              }}
            />
          </div>
          <div className="field">
            <label htmlFor="type">Type</label>
            <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">All</option>
              <option value="movie">Movie</option>
              <option value="show">Show</option>
              <option value="episode">Episode</option>
              <option value="track">Track</option>
              <option value="artist">Artist</option>
              <option value="album">Album</option>
            </select>
          </div>
          <button className="btn" type="button" disabled={loading} onClick={() => void load(0)}>
            Search
          </button>
        </div>
      </div>

      <div className="panel">
        {error ? <div className="status error">{error}</div> : null}
        {data ? (
          <>
            <p className="muted" style={{ marginTop: 0 }}>
              Showing {data.items.length} of {data.total}
            </p>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Year</th>
                    <th>Library</th>
                    <th>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.ratingKey}>
                      <td>{item.title}</td>
                      <td>{item.type}</td>
                      <td>{item.year ?? '—'}</td>
                      <td>{item.libraryName ?? '—'}</td>
                      <td>{item.viewCount ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row" style={{ marginTop: '1rem' }}>
              <button
                className="btn secondary"
                type="button"
                disabled={loading || data.offset <= 0}
                onClick={() => void load(Math.max(0, data.offset - data.limit))}
              >
                Previous
              </button>
              <button
                className="btn secondary"
                type="button"
                disabled={loading || data.offset + data.items.length >= data.total}
                onClick={() => void load(data.offset + data.limit)}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <p className="muted">{loading ? 'Loading…' : 'No data yet.'}</p>
        )}
      </div>
    </div>
  )
}
