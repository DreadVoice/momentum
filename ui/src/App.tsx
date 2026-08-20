import { ErrorBoundary } from './components/common/ErrorBoundary'
import { Spinner } from './components/common/Spinner'
import { AuthProvider } from './context/AuthProvider'
import { AuthCard } from './features/auth/AuthCard'
import { BoardView } from './features/board/BoardView'
import { useAuth } from './hooks/useAuth'

/**
 * Chooses the surface for the current session state. Kept separate from `App`
 * so it sits inside the provider it consumes.
 */
function AppRoutes() {
  const { state } = useAuth()

  if (state.kind === 'restoring') {
    return (
      <div className="app-shell app-shell--centered">
        <Spinner label="Restoring your session" />
      </div>
    )
  }

  if (state.kind === 'anonymous') {
    return (
      <div className="app-shell app-shell--centered">
        <AuthCard sessionExpired={state.sessionExpired} />
      </div>
    )
  }

  return (
    <div className="app-shell">
      {/* Scoped to the dashboard so a board failure never takes down the
          session shell, leaving the user able to recover or sign out. */}
      <ErrorBoundary fallbackTitle="The board could not be displayed">
        <BoardView user={state.user} />
      </ErrorBoundary>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Momentum could not start">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  )
}
