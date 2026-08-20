import { useCallback, type FormEvent } from 'react'
import { Alert } from '../../components/common/Alert'
import { Spinner } from '../../components/common/Spinner'
import { FormField } from './FormField'
import { useAuthForm } from './useAuthForm'

interface AuthCardProps {
  readonly sessionExpired: boolean
}


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
    <div className="auth">
      <section className="auth__aside">
        <p className="micro">Momentum</p>
        <h1 className="auth__headline">
          Keep what matters <em className="display-accent">moving</em>
        </h1>
        <p className="auth__lede">
          Tasks, subtasks and categories, private to your account.
        </p>
        <p className="meta auth__note">
          Pending · In Progress · Completed
        </p>
      </section>

      <section className="auth__main">
        <header className="auth__header">
          <h2 className="auth__title">
            {isRegistering ? 'Create an account' : 'Welcome back'}
          </h2>
          <p className="meta">
            {isRegistering
              ? 'Takes a moment. Nothing is shared.'
              : 'Sign in to pick up where you left off.'}
          </p>
        </header>

        {sessionExpired && (
          <Alert tone="info" message="Your session expired. Please sign in again." />
        )}
        {formError !== null && <Alert tone="error" message={formError} />}

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
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

          <button type="submit" className="m-primary m-block" disabled={isSubmitting}>
            {isSubmitting && <Spinner label="Submitting" size="sm" />}
            {isRegistering ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <footer className="auth__footer">
          <span className="meta">
            {isRegistering ? 'Already have an account?' : 'New to Momentum?'}
          </span>
          <button
            type="button"
            className="m-link"
            onClick={handleToggleMode}
            disabled={isSubmitting}
          >
            {isRegistering ? 'Sign in' : 'Create one'}
          </button>
        </footer>
      </section>
    </div>
  )
}
