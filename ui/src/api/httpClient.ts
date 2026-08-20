import { ApiError, apiErrorFromResponse } from '../lib/ApiError'
import { tokenStorage, type TokenPair } from '../lib/tokenStorage'
import type { AuthResponse } from '../types/api'

/**
 * Transport layer. Owns bearer-token injection, error normalisation and silent
 * access-token renewal. Resource modules stay declarative on top of it.
 *
 * The API is called cross-origin (never same-origin proxied) so that the CORS
 * contract in `CorsConfig` is exercised in development exactly as in production.
 */
const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
).replace(/\/+$/, '')

export type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  readonly body?: unknown
  /** Attach the bearer token and retry once after a silent refresh. */
  readonly authenticated?: boolean
  readonly query?: Readonly<Record<string, QueryValue>>
  readonly signal?: AbortSignal | undefined
  /**
   * Set to false for endpoints where 401 is a domain answer rather than a
   * token problem - the password check and account deletion both reject a
   * wrong password with 401. Refreshing there would rotate a refresh token
   * for nothing and, if the refresh itself failed, would sign the user out
   * because they mistyped their password.
   */
  readonly refreshOn401?: boolean
}

type UnauthorizedHandler = () => void

let onUnauthorized: UnauthorizedHandler | null = null

/**
 * Registered by the auth provider so an unrecoverable 401 tears the session
 * down once, centrally, instead of every caller handling it.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler
}

/**
 * Guards against a refresh stampede: when several requests 401 at the same
 * moment they all await this single in-flight promise rather than each burning
 * a refresh token (the backend rotates and deletes the old row on every use).
 */
let refreshInFlight: Promise<TokenPair | null> | null = null

function buildUrl(path: string, query?: Readonly<Record<string, QueryValue>>): string {
  const url = new URL(`${API_BASE_URL}${path}`)

  if (query !== undefined) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') {
        url.searchParams.append(key, String(value))
      }
    }
  }

  return url.toString()
}

function buildHeaders(hasBody: boolean, accessToken: string | null): Headers {
  const headers = new Headers({ Accept: 'application/json' })

  if (hasBody) {
    headers.set('Content-Type', 'application/json')
  }
  if (accessToken !== null) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return headers
}

async function send(
  path: string,
  options: RequestOptions,
  accessToken: string | null,
): Promise<Response> {
  const hasBody = options.body !== undefined
  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers: buildHeaders(hasBody, accessToken),
    mode: 'cors',
    credentials: 'omit',
  }

  if (hasBody) {
    init.body = JSON.stringify(options.body)
  }
  if (options.signal !== undefined) {
    init.signal = options.signal
  }

  try {
    return await fetch(buildUrl(path, options.query), init)
  } catch (error: unknown) {
    // `fetch` rejects only on transport failure; abort must stay abort so
    // callers can distinguish an intentional cancellation from an outage.
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw ApiError.network()
  }
}

/** Refreshes the token pair, or resolves to null when the session is dead. */
async function refreshTokens(): Promise<TokenPair | null> {
  const current = tokenStorage.read()

  if (current === null) {
    return null
  }

  try {
    const response = await send(
      '/api/auth/refresh',
      { method: 'POST', body: { refreshToken: current.refreshToken } },
      null,
    )

    if (!response.ok) {
      return null
    }

    const auth = (await response.json()) as AuthResponse
    const next: TokenPair = {
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
    }
    tokenStorage.write(next)
    return next
  } catch {
    return null
  }
}

function refreshOnce(): Promise<TokenPair | null> {
  refreshInFlight ??= refreshTokens().finally(() => {
    refreshInFlight = null
  })

  return refreshInFlight
}

async function performRequest(path: string, options: RequestOptions): Promise<Response> {
  const authenticated = options.authenticated ?? true
  const tokens = authenticated ? tokenStorage.read() : null

  if (authenticated && tokens === null) {
    onUnauthorized?.()
    throw new ApiError('Your session has expired. Please sign in again.', 401)
  }

  const response = await send(path, options, tokens?.accessToken ?? null)
  const shouldRefresh = options.refreshOn401 ?? true

  if (response.status !== 401 || !authenticated || !shouldRefresh) {
    return response
  }

  const renewed = await refreshOnce()

  if (renewed === null) {
    tokenStorage.clear()
    onUnauthorized?.()
    throw new ApiError('Your session has expired. Please sign in again.', 401)
  }

  return send(path, options, renewed.accessToken)
}

/** Performs a request that is expected to return a JSON body. */
export async function request<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const response = await performRequest(path, options)

  if (!response.ok) {
    throw await apiErrorFromResponse(response)
  }

  return (await response.json()) as TResponse
}

/** Performs a request whose success case is `204 No Content`. */
export async function requestNoContent(
  path: string,
  options: RequestOptions = {},
): Promise<void> {
  const response = await performRequest(path, options)

  if (!response.ok) {
    throw await apiErrorFromResponse(response)
  }
}
