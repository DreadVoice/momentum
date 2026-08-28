import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { authApi } from '../api/authApi'
import { setUnauthorizedHandler } from '../api/httpClient'
import { isAbortError, isApiError } from '../lib/ApiError'
import { tokenStorage } from '../lib/tokenStorage'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from '../types/api'
import { AuthContext, type AuthContextValue, type AuthState } from './authContext'

const RESTORE_RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000, 15000]

interface AuthProviderProps {
  readonly children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({ kind: 'restoring' })

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


  useEffect(() => {
    if (tokenStorage.read() === null) {
      setState({ kind: 'anonymous', sessionExpired: false })
      return
    }

    const controller = new AbortController()
    let retryTimer: number | undefined

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        retryTimer = window.setTimeout(resolve, ms)
      })

    const restore = async (): Promise<void> => {
      for (let attempt = 0; ; attempt += 1) {
        try {
          const user = await authApi.getCurrentUser(controller.signal)
          if (mountedRef.current) {
            setState({ kind: 'authenticated', user })
          }
          return
        } catch (error: unknown) {
          if (isAbortError(error)) {
            return
          }

          if (!isApiError(error) || !error.isTransient) {
            endSession(false)
            return
          }

          const delayMs = RESTORE_RETRY_DELAYS_MS[attempt]

          if (delayMs === undefined) {
            if (mountedRef.current) {
              setState({ kind: 'anonymous', sessionExpired: false })
            }
            return
          }

          await wait(delayMs)

          if (controller.signal.aborted) {
            return
          }
        }
      }
    }

    void restore()

    return () => {
      controller.abort()
      if (retryTimer !== undefined) {
        window.clearTimeout(retryTimer)
      }
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


    if (tokens !== null) {
      try {
        await authApi.logout(tokens.refreshToken)
      } catch {
      }
    }

    endSession(false)
  }, [endSession])

  const applyUser = useCallback((user: UserResponse) => {
    setState((current) =>
      current.kind === 'authenticated' ? { kind: 'authenticated', user } : current,
    )
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ state, login, register, logout, applyUser }),
    [state, login, register, logout, applyUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
