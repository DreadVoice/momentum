import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { authApi } from '../api/authApi'
import { setUnauthorizedHandler } from '../api/httpClient'
import { isAbortError, isApiError } from '../lib/ApiError'
import { tokenStorage } from '../lib/tokenStorage'
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/api'
import { AuthContext, type AuthContextValue, type AuthState } from './authContext'

interface AuthProviderProps {
  readonly children: ReactNode
}

/**
 * Owns the session: restores it on boot, exposes the credential flows, and
 * reacts to an unrecoverable 401 raised anywhere in the HTTP client.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({ kind: 'restoring' })
  // Guards against a state update after unmount when the boot request resolves
  // late (React 18 double-invokes effects in development).
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const endSession = useCallback((sessionExpired: boolean) => {
    tokenStorage.clear()
    if (mountedRef.current) {
      setState({ kind: 'anonymous', sessionExpired })
    }
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      endSession(true)
    })

    return () => {
      setUnauthorizedHandler(null)
    }
  }, [endSession])

  // Restore an existing session by proving the stored token still resolves a
  // user. A failure here is expected (expired refresh token) and must not be
  // surfaced as an application error.
  useEffect(() => {
    if (tokenStorage.read() === null) {
      setState({ kind: 'anonymous', sessionExpired: false })
      return
    }

    const controller = new AbortController()

    authApi
      .getCurrentUser(controller.signal)
      .then((user) => {
        if (mountedRef.current) {
          setState({ kind: 'authenticated', user })
        }
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) {
          return
        }
        // A network outage should not destroy a session that may still be good.
        const keepTokens = isApiError(error) && error.isNetworkError
        if (keepTokens) {
          if (mountedRef.current) {
            setState({ kind: 'anonymous', sessionExpired: false })
          }
          return
        }
        endSession(false)
      })

    return () => {
      controller.abort()
    }
  }, [endSession])

  const completeAuthentication = useCallback(async (auth: AuthResponse): Promise<void> => {
    tokenStorage.write({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
    })

    const user = await authApi.getCurrentUser()

    if (mountedRef.current) {
      setState({ kind: 'authenticated', user })
    }
  }, [])

  const login = useCallback(
    async (credentials: LoginRequest): Promise<void> => {
      const auth = await authApi.login(credentials)
      await completeAuthentication(auth)
    },
    [completeAuthentication],
  )

  const register = useCallback(
    async (details: RegisterRequest): Promise<void> => {
      const auth = await authApi.register(details)
      await completeAuthentication(auth)
    },
    [completeAuthentication],
  )

  const logout = useCallback(async (): Promise<void> => {
    const tokens = tokenStorage.read()

    // Revoking is best-effort: the local session must end even if the call
    // fails, otherwise a user on a flaky connection can never sign out.
    if (tokens !== null) {
      try {
        await authApi.logout(tokens.refreshToken)
      } catch {
        /* Token will expire on its own. */
      }
    }

    endSession(false)
  }, [endSession])

  const value = useMemo<AuthContextValue>(
    () => ({ state, login, register, logout }),
    [state, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
