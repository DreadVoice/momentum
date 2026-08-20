import { useCallback, useState } from 'react'
import { APP_VIEWS, VIEW_LABELS, type AppView } from './appViews'

interface AppNavProps {
  readonly username: string
  readonly view: AppView
  readonly onViewChange: (view: AppView) => void
  readonly onLogout: () => void
}

/**
 * Primary navigation: a segmented control for the three views, plus the
 * session action. Presentational; the active view is owned above.
 */
export function AppNav({ username, view, onViewChange, onLogout }: AppNavProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = useCallback(() => {
    setIsLoggingOut(true)
    onLogout()
  }, [onLogout])

  return (
    <nav className="app-nav" aria-label="Primary">
      <div className="segmented" role="tablist" aria-label="Views">
        {APP_VIEWS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="tab"
            aria-selected={candidate === view}
            className={
              candidate === view ? 'segmented__item segmented__item--active' : 'segmented__item'
            }
            onClick={() => {
              onViewChange(candidate)
            }}
          >
            {VIEW_LABELS[candidate]}
          </button>
        ))}
      </div>

      <div className="app-nav__session">
        <span className="meta">{username}</span>
        <button
          type="button"
          className="m-oauth m-sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </nav>
  )
}
