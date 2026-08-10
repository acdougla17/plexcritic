import { useEffect, useState } from 'react'

export type ThemeMode = 'dark' | 'light'

const STORAGE_KEY: string = 'plexcritic-theme'

function readStoredTheme(): ThemeMode {
  const stored: string | null = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  return 'dark'
}

export function useTheme(): {
  theme: ThemeMode
  toggleTheme: () => void
} {
  const [theme, setTheme] = useState<ThemeMode>(() => readStoredTheme())

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  function toggleTheme(): void {
    setTheme((prev: ThemeMode) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggleTheme }
}
