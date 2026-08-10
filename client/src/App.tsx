import { useState, type ReactElement } from 'react'
import { useTheme } from './hooks/useTheme'
import { LibraryManagement } from './sections/LibraryManagement'
import { LibraryViewer } from './sections/LibraryViewer'
import { Testing } from './sections/Testing'
import { Health } from './sections/Health'
import { Analytics } from './sections/Analytics'
import { CriticsOffice } from './sections/CriticsOffice'

type SectionId =
  | 'library-management'
  | 'library-viewer'
  | 'testing'
  | 'health'
  | 'analytics'
  | 'critics-office'

type NavItem = {
  id: SectionId
  label: string
}

const NAV: NavItem[] = [
  { id: 'library-management', label: 'Library Management' },
  { id: 'library-viewer', label: 'Library Viewer' },
  { id: 'testing', label: 'Testing' },
  { id: 'health', label: 'Health' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'critics-office', label: 'Critics Office' },
]

function renderSection(id: SectionId): ReactElement {
  switch (id) {
    case 'library-management':
      return <LibraryManagement />
    case 'library-viewer':
      return <LibraryViewer />
    case 'testing':
      return <Testing />
    case 'health':
      return <Health />
    case 'analytics':
      return <Analytics />
    case 'critics-office':
      return <CriticsOffice />
  }
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [section, setSection] = useState<SectionId>('analytics')

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>Plex Critic</h1>
          <p>Own less noise. Know your formats.</p>
        </div>
        <nav className="nav" aria-label="Dashboard sections">
          {NAV.map((item: NavItem) => (
            <button
              key={item.id}
              type="button"
              className={`nav-btn ${section === item.id ? 'active' : ''}`}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button className="theme-toggle" type="button" onClick={toggleTheme}>
          {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        </button>
      </aside>
      <main className="main" key={section}>
        {renderSection(section)}
      </main>
    </div>
  )
}
