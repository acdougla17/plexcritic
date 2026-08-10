import { useEffect, useState } from 'react'
import { fetchJson, type HealthResponse, type SyncHealthResponse } from '../api/client'

function formatUptime(seconds: number): string {
  const s: number = Math.floor(seconds)
  const hrs: number = Math.floor(s / 3600)
  const mins: number = Math.floor((s % 3600) / 60)
  const secs: number = s % 60
  return `${hrs}h ${mins}m ${secs}s`
}

function formatTs(value: number | null): string {
  if (value === null || value === undefined) {
    return '—'
  }
  const ms: number = value > 1_000_000_000_000 ? value : value * 1000
  return new Date(ms).toLocaleString()
}

export function Health() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [sync, setSync] = useState<SyncHealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load(): Promise<void> {
    setError(null)
    try {
      const [h, s] = await Promise.all([
        fetchJson<HealthResponse>('/health'),
        fetchJson<SyncHealthResponse>('/health/sync?limit=25'),
      ])
      setHealth(h)
      setSync(s)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load health')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div>
      <header className="section-header">
        <h2>Health</h2>
        <p>Server uptime and recent sync activity from the local database.</p>
      </header>

      {error ? <div className="status error">{error}</div> : null}

      <div className="panel">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Process</h3>
          <button className="btn secondary" type="button" onClick={() => void load()}>
            Refresh
          </button>
        </div>
        {health ? (
          <div className="stat-grid" style={{ marginTop: '1rem' }}>
            <div className="stat">
              <span className="label">Status</span>
              <span className="value">{health.message}</span>
            </div>
            <div className="stat">
              <span className="label">Uptime</span>
              <span className="value" style={{ fontSize: '1.2rem' }}>
                {formatUptime(health.uptime)}
              </span>
            </div>
          </div>
        ) : (
          <p className="muted">Loading…</p>
        )}
      </div>

      <div className="panel">
        <h3>Sync log</h3>
        {sync ? (
          <>
            <div className="stat-grid" style={{ marginBottom: '1rem' }}>
              <div className="stat">
                <span className="label">Entries</span>
                <span className="value">{sync.totalEntries}</span>
              </div>
              <div className="stat">
                <span className="label">Latest sync</span>
                <span className="value" style={{ fontSize: '1rem' }}>
                  {formatTs(sync.latestSyncedAt)}
                </span>
              </div>
            </div>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Rating key</th>
                    <th>Entry</th>
                  </tr>
                </thead>
                <tbody>
                  {sync.recent.map((row) => (
                    <tr key={row.id}>
                      <td>{formatTs(row.lastSynced)}</td>
                      <td>{row.ratingKey ?? '—'}</td>
                      <td>{row.logEntry ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="muted">Loading sync activity…</p>
        )}
      </div>
    </div>
  )
}
