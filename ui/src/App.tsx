import { lazy, Suspense, useCallback, useState } from 'react'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { LoadingScreen } from './components/common/LoadingScreen'
import { AppNav } from './components/layout/AppNav'
import type { AppView } from './components/layout/appViews'
import { Logo } from './components/layout/Logo'
import { ThemeProvider } from './components/theme/ThemeProvider'
import { TooltipProvider } from './components/ui/tooltip'
import { AuthProvider } from './context/AuthProvider'
import { AuthCard } from './features/auth/AuthCard'
import { useAuth } from './hooks/useAuth'
import type { UserResponse } from './types/api'

/*
 * Every view lives behind authentication, so the sign-in screen has no reason
 * to carry the board's drag-and-drop and animation libraries. Splitting here
 * keeps the first load small for a visitor who is not signed in yet.
 */
const BoardView = lazy(() =>
  import('./features/board/BoardView').then((module) => ({ default: module.BoardView })),
)
const CategoriesView = lazy(() =>
  import('./features/categories/CategoriesView').then((module) => ({
    default: module.CategoriesView,
  })),
)
const AccountView = lazy(() =>
  import('./features/account/AccountView').then((module) => ({ default: module.AccountView })),
)

function ViewFallback() {
  return (
    <div className="flex min-h-64 items-center justify-center p-8">
      <LoadingScreen label="Loading" slowMessage="Still working on it." />
    </div>
  )
}

function Dashboard({ user }: { readonly user: UserResponse }) {
  const { logout } = useAuth()
  const [view, setView] = useState<AppView>('board')

  const handleLogout = useCallback(() => {
    void logout()
  }, [logout])

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav
        username={user.username}
        view={view}
        onViewChange={setView}
        onLogout={handleLogout}
      />

      <main className="mx-auto w-full max-w-[1400px] flex-1">
        <ErrorBoundary key={view} fallbackTitle="This view could not be displayed">
          <Suspense fallback={<ViewFallback />}>
            {view === 'board' && <BoardView />}
            {view === 'categories' && <CategoriesView />}
            {view === 'account' && <AccountView user={user} />}
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
}

function AppRoutes() {
  const { state } = useAuth()

  if (state.kind === 'restoring') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
        <Logo className="size-9" />
        <LoadingScreen
          label="Restoring your session"
          slowMessage="The server is waking up. This can take up to a minute."
        />
      </div>
    )
  }

  if (state.kind === 'anonymous') {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-4xl">
          <AuthCard sessionExpired={state.sessionExpired} />
        </div>
      </div>
    )
  }

  return <Dashboard user={state.user} />
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Momentum could not start">
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
