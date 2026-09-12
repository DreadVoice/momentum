import { use } from 'react'
import { ThemeContext, type ThemeContextValue } from './themeContext'

export function useTheme(): ThemeContextValue {
  const context = use(ThemeContext)

  if (context === null) {
    throw new Error('useTheme must be used inside a ThemeProvider.')
  }

  return context
}
