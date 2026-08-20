import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { isApiError, toErrorMessage } from '../../lib/ApiError'

export type AuthMode = 'login' | 'register'

export interface AuthFormValues {
  readonly usernameOrEmail: string
  readonly username: string
  readonly email: string
  readonly password: string
}

const EMPTY_VALUES: AuthFormValues = {
  usernameOrEmail: '',
  username: '',
  email: '',
  password: '',
}

/** Mirrors the Jakarta constraints on RegisterRequest/LoginRequest. */
const USERNAME_PATTERN = /^[A-Za-z0-9_-]+$/
const MIN_PASSWORD_LENGTH = 8
const MIN_USERNAME_LENGTH = 3
const MAX_USERNAME_LENGTH = 50

export type FieldErrors = Readonly<Partial<Record<keyof AuthFormValues, string>>>

export interface UseAuthFormResult {
  readonly mode: AuthMode
  readonly values: AuthFormValues
  readonly fieldErrors: FieldErrors
  readonly formError: string | null
  readonly isSubmitting: boolean
  readonly setMode: (mode: AuthMode) => void
  readonly setValue: (field: keyof AuthFormValues, value: string) => void
  readonly submit: () => Promise<void>
}

/**
 * Validates locally first so obvious mistakes never spend one of the five
 * requests per minute that `RateLimitFilter` allows on the auth endpoints,
 * then maps any server-side `fieldErrors` back onto the inputs.
 */
export function useAuthForm(initialMode: AuthMode = 'login'): UseAuthFormResult {
  const { login, register } = useAuth()
  const [mode, setModeState] = useState<AuthMode>(initialMode)
  const [values, setValues] = useState<AuthFormValues>(EMPTY_VALUES)
  const [serverFieldErrors, setServerFieldErrors] = useState<FieldErrors>({})
  const [localFieldErrors, setLocalFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fieldErrors = useMemo<FieldErrors>(
    () => ({ ...serverFieldErrors, ...localFieldErrors }),
    [serverFieldErrors, localFieldErrors],
  )

  const setMode = useCallback((next: AuthMode) => {
    setModeState(next)
    setServerFieldErrors({})
    setLocalFieldErrors({})
    setFormError(null)
  }, [])

  const setValue = useCallback((field: keyof AuthFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    // Clear the message for the field being corrected, not the whole form.
    setLocalFieldErrors((current) => {
      if (current[field] === undefined) {
        return current
      }
      const next = { ...current }
      delete next[field]
      return next
    })
    setServerFieldErrors((current) => {
      if (current[field] === undefined) {
        return current
      }
      const next = { ...current }
      delete next[field]
      return next
    })
  }, [])

  const validate = useCallback(
    (candidate: AuthFormValues, currentMode: AuthMode): FieldErrors => {
      const errors: Record<string, string> = {}

      if (currentMode === 'login') {
        if (candidate.usernameOrEmail.trim().length === 0) {
          errors.usernameOrEmail = 'Enter your username or email.'
        }
      } else {
        const username = candidate.username.trim()

        if (username.length < MIN_USERNAME_LENGTH || username.length > MAX_USERNAME_LENGTH) {
          errors.username = 'Username must be between 3 and 50 characters.'
        } else if (!USERNAME_PATTERN.test(username)) {
          errors.username = 'Use only letters, numbers, underscores and hyphens.'
        }

        if (!candidate.email.includes('@') || candidate.email.trim().length < 3) {
          errors.email = 'Enter a valid email address.'
        }
      }

      if (candidate.password.length < MIN_PASSWORD_LENGTH) {
        errors.password = 'Password must be at least 8 characters.'
      }

      return errors
    },
    [],
  )

  const submit = useCallback(async (): Promise<void> => {
    const validationErrors = validate(values, mode)

    setFormError(null)
    setServerFieldErrors({})
    setLocalFieldErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        await login({
          usernameOrEmail: values.usernameOrEmail.trim(),
          password: values.password,
        })
      } else {
        await register({
          username: values.username.trim(),
          email: values.email.trim(),
          password: values.password,
        })
      }
    } catch (error: unknown) {
      if (isApiError(error) && Object.keys(error.fieldErrors).length > 0) {
        setServerFieldErrors(error.fieldErrors as FieldErrors)
      }
      setFormError(toErrorMessage(error))
    } finally {
      // The component stays mounted on failure; on success it unmounts, and
      // React discards the update on an unmounted component without warning.
      setIsSubmitting(false)
    }
  }, [values, mode, validate, login, register])

  return {
    mode,
    values,
    fieldErrors,
    formError,
    isSubmitting,
    setMode,
    setValue,
    submit,
  }
}
