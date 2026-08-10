import { useEffect, useState } from 'react'
import {
  fetchJson,
  type DbStats,
  type LibrariesResponse,
  type LibrarySection,
} from '../api/client'

type Status = {
  message: string
  isError: boolean
}

export function LibraryManagement() {
  const [stats, setStats] = useState<DbStats | null>(null)
  const [libraries, setLibraries] = useState<LibrariesResponse | null>(null)
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [manualKeys, setManualKeys] = useState<string>('')
  const [tableName, setTableName] = useState<string>('media')
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState<boolean>(false)

  async function loadStats(): Promise<void> {
    const next: DbStats = await fetchJson<DbStats>('/db/stats')
    setStats(next)
  }

  async function loadLibraries(): Promise<void> {
    const next: LibrariesResponse = await fetchJson<LibrariesResponse>(
      '/getFromPlex/getAllLibraries/',
    )
    setLibraries(next)
    const first: LibrarySection | undefined =
      next.movies[0] ?? next.shows[0] ?? next.music[0] ?? next.other[0]
    if (first) {
      setSelectedKey(first.key)
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        await Promise.all([loadStats(), loadLibraries()])
      } catch (err: unknown) {
        const message: string = err instanceof Error ? err.message : 'Failed to load'
        setStatus({ message, isError: true })
      }
    })()
  }, [])

  async function refreshSection(sectionKey: string): Promise<void> {
    if (!sectionKey) {
      setStatus({ message: 'Choose a section or enter keys manually.', isError: true })
      return
    }
    setBusy(true)
    setStatus({ message: `Refreshing ${sectionKey}…`, isError: false })
    try {
      await fetchJson(`/refreshLibrary/${encodeURIComponent(sectionKey)}`)
      await loadStats()
      setStatus({ message: `Refresh finished for ${sectionKey}.`, isError: false })
    } catch (err: unknown) {
      const message: string = err instanceof Error ? err.message : 'Refresh failed'
      setStatus({ message, isError: true })
    } finally {
      setBusy(false)
    }
  }

  async function clearTable(name: string): Promise<void> {
    const confirmed: boolean = window.confirm(
      name === 'ALL'
        ? 'Clear the entire local database? This cannot be undone.'
        : `Clear all rows from "${name}"?`,
    )
    if (!confirmed) {
      return
    }
    setBusy(true)
    try {
      const url: string =
        name === 'ALL' ? '/db/removeAll/' : `/db/remove/${encodeURIComponent(name)}`
      await fetchJson(url)
      await loadStats()
      setStatus({
        message: name === 'ALL' ? 'Database cleared.' : `Cleared table ${name}.`,
        isError: false,
      })
    } catch (err: unknown) {
      const message: string = err instanceof Error ? err.message : 'Clear failed'
      setStatus({ message, isError: true })
    } finally {
      setBusy(false)
    }
  }

  const groups: Array<{ key: keyof LibrariesResponse; label: string }> = [
    { key: 'movies', label: 'Movies' },
    { key: 'shows', label: 'Shows' },
    { key: 'music', label: 'Music' },
    { key: 'other', label: 'Other' },
  ]

  return (
    <div>
      <header className="section-header">
        <h2>Library Management</h2>
        <p>Pull Plex sections into the local database, or clear tables when you need a clean slate.</p>
      </header>

      {status ? (
        <div className={`status ${status.isError ? 'error' : ''}`} style={{ marginBottom: '1rem' }}>
          {status.message}
        </div>
      ) : null}

      <div className="panel">
        <h3>Refresh</h3>
        <div className="stack">
          <div className="field">
            <label htmlFor="librarySelect">Library section</label>
            <select
              id="librarySelect"
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
            >
              {!libraries ? <option value="">Loading…</option> : null}
              {libraries
                ? groups.map((group) => {
                    const items: LibrarySection[] = libraries[group.key] ?? []
                    if (items.length === 0) {
                      return null
                    }
                    return (
                      <optgroup key={group.key} label={group.label}>
                        {items.map((section: LibrarySection) => (
                          <option key={section.key} value={section.key}>
                            {group.label} — {section.title} ({section.key})
                          </option>
                        ))}
                      </optgroup>
                    )
                  })
                : null}
            </select>
          </div>
          <div className="row">
            <button
              className="btn"
              disabled={busy}
              type="button"
              onClick={() => void refreshSection(selectedKey)}
            >
              Refresh selected
            </button>
            <button
              className="btn secondary"
              disabled={busy}
              type="button"
              onClick={() => void refreshSection('ALL')}
            >
              Refresh all
            </button>
          </div>
          <div className="field">
            <label htmlFor="manualKeys">Or enter section keys (comma-separated)</label>
            <input
              id="manualKeys"
              value={manualKeys}
              onChange={(e) => setManualKeys(e.target.value)}
              placeholder="e.g. 1,2"
            />
          </div>
          <button
            className="btn secondary"
            disabled={busy}
            type="button"
            onClick={() => void refreshSection(manualKeys.trim())}
          >
            Refresh custom keys
          </button>
        </div>
      </div>

      <div className="panel">
        <h3>Database cleanup</h3>
        <div className="row">
          <div className="field">
            <label htmlFor="tableName">Table</label>
            <input
              id="tableName"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              list="tableOptions"
            />
            <datalist id="tableOptions">
              {stats
                ? Object.keys(stats).map((name: string) => (
                    <option key={name} value={name} />
                  ))
                : null}
            </datalist>
          </div>
          <button
            className="btn danger"
            disabled={busy}
            type="button"
            onClick={() => void clearTable(tableName.trim())}
          >
            Clear table
          </button>
          <button
            className="btn danger"
            disabled={busy}
            type="button"
            onClick={() => void clearTable('ALL')}
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="panel">
        <h3>Table row counts</h3>
        {stats ? (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Rows</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats).map(([table, count]) => (
                  <tr key={table}>
                    <td>{table}</td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Loading stats…</p>
        )}
      </div>
    </div>
  )
}
