import { useCallback, useState } from 'react'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { Spinner } from './components/common/Spinner'
import { AppNav } from './components/layout/AppNav'
import type { AppView } from './components/layout/appViews'
import { WindowChrome } from './components/layout/WindowChrome'
import { AuthProvider } from './context/AuthProvider'
import { AccountView } from './features/account/AccountView'
import { AuthCard } from './features/auth/AuthCard'
import { BoardView } from './features/board/BoardView'
import { CategoriesView } from './features/categories/CategoriesView'
import { useAuth } from './hooks/useAuth'
import type { UserResponse } from './types/api'

interface DashboardProps {
  readonly user: UserResponse
}

function Dashboard({ user }: DashboardProps) {
  const { logout } = useAuth()
  const [view, setView] = useState<AppView>('board')

  const handleLogout = useCallback(() => {
    void logout()
  }, [logout])

  return (
    <WindowChrome name="Momentum">
      <AppNav
        username={user.username}
        view={view}
        onViewChange={setView}
        onLogout={handleLogout}
      />

      
      <ErrorBoundary key={view} fallbackTitle="This view could not be displayed">
        {view === 'board' && <BoardView />}
        {view === 'categories' && <CategoriesView />}
        {view === 'account' && <AccountView user={user} />}
      </ErrorBoundary>
    </WindowChrome>
  )
}

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
        <WindowChrome name="Momentum">
          <AuthCard sessionExpired={state.sessionExpired} />
        </WindowChrome>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Dashboard user={state.user} />
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
