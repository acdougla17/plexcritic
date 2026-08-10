import { useState } from 'react'

export function Testing() {
  const [endpoint, setEndpoint] = useState<string>('/library/sections')
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<boolean>(false)

  async function runTest(): Promise<void> {
    setBusy(true)
    setError(null)
    try {
      const url: string = `/getFromPlex/raw?endpoint=${encodeURIComponent(endpoint)}`
      const res: Response = await fetch(url)
      const text: string = await res.text()
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}: ${text}`)
      }
      try {
        setResult(JSON.stringify(JSON.parse(text), null, 2))
      } catch {
        setResult(text)
      }
    } catch (err: unknown) {
      setResult('')
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <header className="section-header">
        <h2>Testing</h2>
        <p>Hit raw Plex endpoints through the local proxy.</p>
      </header>

      <div className="panel">
        <div className="stack">
          <div className="field">
            <label htmlFor="endpoint">Plex endpoint path</label>
            <input
              id="endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/library/sections"
            />
          </div>
          <button className="btn" type="button" disabled={busy} onClick={() => void runTest()}>
            Run request
          </button>
          {error ? <div className="status error">{error}</div> : null}
          <div className="field">
            <label htmlFor="result">Response</label>
            <textarea id="result" readOnly value={result} placeholder="Response appears here…" />
          </div>
        </div>
      </div>
    </div>
  )
}
