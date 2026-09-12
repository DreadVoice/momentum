import { CheckCircle2Icon } from 'lucide-react'
import { useCallback, type FormEvent } from 'react'
import { Alert } from '../../components/common/Alert'
import { Spinner } from '../../components/common/Spinner'
import { Logo } from '../../components/layout/Logo'
import { ThemeToggle } from '../../components/theme/ThemeToggle'
import { Button } from '../../components/ui/button'
import { FormField } from './FormField'
import { useAuthForm } from './useAuthForm'

interface AuthCardProps {
  readonly sessionExpired: boolean
}

const HIGHLIGHTS = [
  'Three boards: Pending, In Progress, Completed',
  'Break work into subtasks and track progress',
  'Group by category and catch what is overdue',
] as const

export function AuthCard({ sessionExpired }: AuthCardProps) {
  const { mode, values, fieldErrors, formError, isSubmitting, setMode, setValue, submit } =
    useAuthForm('login')

  const isRegistering = mode === 'register'

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void submit()
    },
    [submit],
  )

  const handleToggleMode = useCallback(() => {
    setMode(isRegistering ? 'login' : 'register')
  }, [isRegistering, setMode])

  return (
    <div className="grid w-full overflow-hidden rounded-xl border bg-card shadow-sm lg:grid-cols-2">
      <section className="hidden flex-col justify-between gap-8 border-r bg-muted/50 p-10 lg:flex">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-sm font-semibold tracking-tight">Momentum</span>
        </div>

        <div className="flex flex-col gap-5">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance">
            Keep what matters moving.
          </h1>
          <ul className="flex flex-col gap-3">
            {HIGHLIGHTS.map((highlight) => (
              <li key={highlight} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <CheckCircle2Icon
                  className="mt-0.5 size-4 shrink-0 text-success"
                  aria-hidden="true"
                />
                {highlight}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          Accounts are isolated: no request can reach another account&rsquo;s data.
        </p>
      </section>

      <section className="flex flex-col gap-5 p-6 sm:p-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="mb-2 flex items-center gap-2 lg:hidden">
              <Logo />
              <span className="text-sm font-semibold tracking-tight">Momentum</span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              {isRegistering ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isRegistering
                ? 'Takes a moment. Nothing is shared.'
                : 'Sign in to pick up where you left off.'}
            </p>
          </div>
          <ThemeToggle />
        </div>

        {sessionExpired && (
          <Alert tone="info" message="Your session expired. Please sign in again." />
        )}
        {formError !== null && <Alert tone="error" message={formError} />}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          {isRegistering ? (
            <>
              <FormField
                label="Username"
                type="text"
                value={values.username}
                error={fieldErrors.username}
                autoComplete="username"
                disabled={isSubmitting}
                hint="3–50 characters: letters, numbers, underscores, hyphens."
                onChange={(value) => {
                  setValue('username', value)
                }}
              />
              <FormField
                label="Email"
                type="email"
                value={values.email}
                error={fieldErrors.email}
                autoComplete="email"
                disabled={isSubmitting}
                onChange={(value) => {
                  setValue('email', value)
                }}
              />
            </>
          ) : (
            <FormField
              label="Username or email"
              type="text"
              value={values.usernameOrEmail}
              error={fieldErrors.usernameOrEmail}
              autoComplete="username"
              disabled={isSubmitting}
              onChange={(value) => {
                setValue('usernameOrEmail', value)
              }}
            />
          )}

          <FormField
            label="Password"
            type="password"
            value={values.password}
            error={fieldErrors.password}
            autoComplete={isRegistering ? 'new-password' : 'current-password'}
            disabled={isSubmitting}
            hint={isRegistering ? 'At least 8 characters.' : undefined}
            onChange={(value) => {
              setValue('password', value)
            }}
          />

          <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
            {isSubmitting && <Spinner label="Submitting" size="sm" />}
            {isRegistering ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <div className="flex items-center justify-center gap-1.5 border-t pt-4 text-sm">
          <span className="text-muted-foreground">
            {isRegistering ? 'Already have an account?' : 'New to Momentum?'}
          </span>
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={handleToggleMode}
            disabled={isSubmitting}
          >
            {isRegistering ? 'Sign in' : 'Create one'}
          </Button>
        </div>
      </section>
    </div>
  )
}
