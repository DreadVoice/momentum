import { useCallback, type FormEvent } from 'react'
import { Alert } from '../../components/common/Alert'
import { Spinner } from '../../components/common/Spinner'
import { FormField } from './FormField'
import { useAuthForm } from './useAuthForm'

interface AuthCardProps {
  /** Set when a previously valid session was rejected by the API. */
  readonly sessionExpired: boolean
}

/**
 * Container for the sign-in / sign-up flow. Rendered inline as a card rather
 * than in a separate window or route so the shell stays a single surface.
 */
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
    <div className="auth-card">
      <header className="auth-card__header">
        <p className="auth-card__brand">Momentum</p>
        <h1 className="auth-card__title">{isRegistering ? 'Create an account' : 'Welcome back'}</h1>
        <p className="auth-card__subtitle">
          {isRegistering
            ? 'Your tasks stay private to your account.'
            : 'Sign in to pick up where you left off.'}
        </p>
      </header>

      {sessionExpired && (
        <Alert tone="info" message="Your session expired. Please sign in again." />
      )}
      {formError !== null && <Alert tone="error" message={formError} />}

      <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
        {isRegistering ? (
          <>
            <FormField
              label="Username"
              type="text"
              value={values.username}
              error={fieldErrors.username}
              autoComplete="username"
              disabled={isSubmitting}
              hint="3–50 characters: letters, numbers, underscores and hyphens."
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

        <button type="submit" className="btn btn--primary btn--block" disabled={isSubmitting}>
          {isSubmitting && <Spinner label="Submitting" size="sm" />}
          {isRegistering ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <footer className="auth-card__footer">
        <span>{isRegistering ? 'Already have an account?' : 'New to Momentum?'}</span>
        <button
          type="button"
          className="btn btn--link"
          onClick={handleToggleMode}
          disabled={isSubmitting}
        >
          {isRegistering ? 'Sign in' : 'Create one'}
        </button>
      </footer>
    </div>
  )
}
