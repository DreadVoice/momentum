import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from './themeContext'

const STORAGE_KEY = 'momentum-theme'

function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch {
  }
  return 'system'
}

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)

  const resolved: 'light' | 'dark' = useMemo(() => {
    if (theme !== 'system') {
      return theme
    }
    return prefersDark() ? 'dark' : 'light'
  }, [theme])

  useEffect(() => {
    const root = document.documentElement

    const apply = (): void => {
      const isDark = theme === 'dark' || (theme === 'system' && prefersDark())
      root.classList.toggle('dark', isDark)
      root.style.colorScheme = isDark ? 'dark' : 'light'
    }

    apply()

    if (theme !== 'system') {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', apply)
    return () => {
      media.removeEventListener('change', apply)
    }
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
    }
  }, [])

  const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme])

  return <ThemeContext value={value}>{children}</ThemeContext>
}
