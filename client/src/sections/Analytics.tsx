import { useEffect, useState, type ReactElement } from 'react'
import { fetchJson, type CandidatesResponse, type FormatSummary } from '../api/client'

function BreakdownBars(props: {
  title: string
  rows: Array<{ value: string; count: number }>
}): ReactElement {
  const max: number = props.rows.reduce((acc: number, row) => Math.max(acc, row.count), 0) || 1
  return (
    <div className="panel">
      <h3>{props.title}</h3>
      {props.rows.length === 0 ? (
        <p className="muted">No video files yet. Sync a library section first.</p>
      ) : (
        <div className="bar-list">
          {props.rows.map((row) => (
            <div className="bar-row" key={row.value}>
              <span>{row.value}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${Math.max(6, (row.count / max) * 100)}%` }}
                />
              </div>
              <span className="muted">{row.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Analytics() {
  const [summary, setSummary] = useState<FormatSummary | null>(null)
  const [candidates, setCandidates] = useState<CandidatesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load(): Promise<void> {
    setError(null)
    try {
      const [s, c] = await Promise.all([
        fetchJson<FormatSummary>('/formats/summary'),
        fetchJson<CandidatesResponse>('/formats/candidates?limit=50&offset=0'),
      ])
      setSummary(s)
      setCandidates(c)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div>
      <header className="section-header">
        <h2>Analytics</h2>
        <p>
          Format breakdown and transcode candidates based on your preferred codecs and containers.
        </p>
      </header>

      {error ? <div className="status error">{error}</div> : null}

      {summary ? (
        <>
          <div className="panel">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Library formats</h3>
              <button className="btn secondary" type="button" onClick={() => void load()}>
                Refresh
              </button>
            </div>
            <div className="stat-grid" style={{ marginTop: '1rem' }}>
              <div className="stat">
                <span className="label">Media files</span>
                <span className="value">{summary.totalFiles}</span>
              </div>
              <div className="stat">
                <span className="label">Video files</span>
                <span className="value">{summary.videoFiles}</span>
              </div>
              <div className="stat">
                <span className="label">Candidates</span>
                <span className="value">{summary.candidateCount}</span>
              </div>
              <div className="stat">
                <span className="label">Need conversion</span>
                <span className="value">{summary.candidatePercent}%</span>
              </div>
            </div>
          </div>

          <BreakdownBars title="By video codec" rows={summary.byCodec} />
          <BreakdownBars title="By container" rows={summary.byContainer} />
          <BreakdownBars title="By resolution" rows={summary.byResolution} />

          <div className="panel">
            <h3>Preferred formats</h3>
            <p className="muted" style={{ marginTop: 0 }}>
              Files outside these rules show up as transcode candidates. Editing from the UI comes
              later.
            </p>
            <div className="stat-grid">
              <div className="stat">
                <span className="label">Codecs</span>
                <span>{summary.preferences.acceptableVideoCodecs.join(', ')}</span>
              </div>
              <div className="stat">
                <span className="label">Containers</span>
                <span>{summary.preferences.acceptableContainers.join(', ')}</span>
              </div>
              <div className="stat">
                <span className="label">Resolutions</span>
                <span>{summary.preferences.acceptableResolutions.join(', ')}</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="muted">Loading format summary…</p>
      )}

      <div className="panel">
        <h3>Transcode candidates</h3>
        {candidates && candidates.candidates.length > 0 ? (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Codec</th>
                  <th>Container</th>
                  <th>Resolution</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {candidates.candidates.map((c) => (
                  <tr key={c.id}>
                    <td>{c.title}</td>
                    <td>{c.type}</td>
                    <td>{c.videoCodec ?? '—'}</td>
                    <td>{c.container ?? '—'}</td>
                    <td>{c.videoResolution ?? '—'}</td>
                    <td>{c.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">
            {candidates ? 'No candidates — your video files match the preferences.' : 'Loading…'}
          </p>
        )}
      </div>
    </div>
  )
}
