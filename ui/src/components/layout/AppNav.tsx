import { LayoutGridIcon, LogOutIcon, TagsIcon, UserIcon } from 'lucide-react'
import { useCallback, useState } from 'react'
import { cn } from '../../lib/utils'
import { ThemeToggle } from '../theme/ThemeToggle'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Spinner } from '../common/Spinner'
import { APP_VIEWS, VIEW_LABELS, type AppView } from './appViews'
import { Logo } from './Logo'

interface AppNavProps {
  readonly username: string
  readonly view: AppView
  readonly onViewChange: (view: AppView) => void
  readonly onLogout: () => void
}

const VIEW_ICONS = {
  board: LayoutGridIcon,
  categories: TagsIcon,
  account: UserIcon,
} as const

export function AppNav({ username, view, onViewChange, onLogout }: AppNavProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = useCallback(() => {
    setIsLoggingOut(true)
    onLogout()
  }, [onLogout])

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">Momentum</span>
        </div>

        <nav aria-label="Primary" className="min-w-0 flex-1">
          <div
            role="tablist"
            aria-label="Views"
            className="inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.5"
          >
            {APP_VIEWS.map((candidate) => {
              const Icon = VIEW_ICONS[candidate]
              const isActive = candidate === view

              return (
                <button
                  key={candidate}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3',
                    'focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none',
                    isActive
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => {
                    onViewChange(candidate)
                  }}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline">{VIEW_LABELS[candidate]}</span>
                  <span className="sr-only sm:hidden">{VIEW_LABELS[candidate]}</span>
                </button>
              )
            })}
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="max-w-40 gap-2 px-2"
                aria-label={`Account menu for ${username}`}
              >
                <span
                  aria-hidden="true"
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-[11px] font-semibold text-brand uppercase"
                >
                  {username.slice(0, 1)}
                </span>
                <span className="hidden truncate text-sm font-normal md:inline">{username}</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuLabel className="truncate font-normal text-foreground">
                {username}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  onViewChange('account')
                }}
              >
                <UserIcon />
                Account settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isLoggingOut}
                onSelect={(event) => {
                  // Keep the menu mounted so the pending state stays visible.
                  event.preventDefault()
                  handleLogout()
                }}
              >
                {isLoggingOut ? <Spinner label="Signing out" size="sm" /> : <LogOutIcon />}
                {isLoggingOut ? 'Signing out…' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
