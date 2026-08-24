import { ApiError, apiErrorFromResponse } from '../lib/ApiError'
import { tokenStorage, type TokenPair } from '../lib/tokenStorage'
import type { AuthResponse } from '../types/api'


const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
).replace(/\/+$/, '')

export type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  readonly body?: unknown
  readonly authenticated?: boolean
  readonly query?: Readonly<Record<string, QueryValue>>
  readonly signal?: AbortSignal | undefined
 
  readonly refreshOn401?: boolean
}

type UnauthorizedHandler = () => void

let onUnauthorized: UnauthorizedHandler | null = null


export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler
}


const REFRESH_LOCK = 'momentum.token-refresh'

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

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw ApiError.network()
  }
}

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

async function adoptOrRefresh(previous: string | null): Promise<TokenPair | null> {
  const latest = tokenStorage.read()

  if (latest !== null && previous !== null && latest.refreshToken !== previous) {
    return latest
  }

  return refreshTokens()
}

function withRefreshLock(run: () => Promise<TokenPair | null>): Promise<TokenPair | null> {
  const locks: LockManager | undefined = navigator.locks

  return locks === undefined ? run() : locks.request(REFRESH_LOCK, run)
}

function refreshOnce(previous: string | null): Promise<TokenPair | null> {
  refreshInFlight ??= withRefreshLock(() => adoptOrRefresh(previous)).finally(() => {
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

  const renewed = await refreshOnce(tokens?.refreshToken ?? null)

  if (renewed === null) {
    tokenStorage.clear()
    onUnauthorized?.()
    throw new ApiError('Your session has expired. Please sign in again.', 401)
  }

  return send(path, options, renewed.accessToken)
}

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

export async function requestNoContent(
  path: string,
  options: RequestOptions = {},
): Promise<void> {
  const response = await performRequest(path, options)

  if (!response.ok) {
    throw await apiErrorFromResponse(response)
  }
}
