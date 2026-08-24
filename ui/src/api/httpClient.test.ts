import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { request, setUnauthorizedHandler } from './httpClient'
import { tokenStorage } from '../lib/tokenStorage'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('httpClient', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setUnauthorizedHandler(null)
    tokenStorage.write({ accessToken: 'access-1', refreshToken: 'refresh-1' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends the access token as a bearer header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { id: 1 }))
    vi.stubGlobal('fetch', fetchMock)

    await request('/api/users/me')

    const [, init] = fetchMock.mock.calls[0] ?? []
    const headers = (init as RequestInit).headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer access-1')
  })

  it('refreshes once and retries after a 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'access-2', refreshToken: 'refresh-2' }))
      .mockResolvedValueOnce(jsonResponse(200, { id: 1 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(request('/api/users/me')).resolves.toEqual({ id: 1 })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(tokenStorage.read()?.accessToken).toBe('access-2')
  })

  it('refreshes only once for concurrent failures', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes('/api/auth/refresh')) {
        return Promise.resolve(
          jsonResponse(200, { accessToken: 'access-2', refreshToken: 'refresh-2' }),
        )
      }
      return Promise.resolve(jsonResponse(401, {}))
    })
    vi.stubGlobal('fetch', fetchMock)

    await Promise.allSettled([request('/api/tasks'), request('/api/categories')])

    const refreshCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/api/auth/refresh'),
    )
    expect(refreshCalls).toHaveLength(1)
  })

  it('clears tokens and signals when the refresh is rejected', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, {}))
    vi.stubGlobal('fetch', fetchMock)

    await expect(request('/api/users/me')).rejects.toThrow()

    expect(tokenStorage.read()).toBeNull()
    expect(onUnauthorized).toHaveBeenCalled()
  })
  it('adopts a token rotated by another tab instead of refreshing again', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => {
        tokenStorage.write({ accessToken: 'access-9', refreshToken: 'refresh-9' })
        return Promise.resolve(jsonResponse(401, {}))
      })
      .mockResolvedValueOnce(jsonResponse(200, { id: 1 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(request('/api/users/me')).resolves.toEqual({ id: 1 })

    const refreshCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/api/auth/refresh'),
    )
    expect(refreshCalls).toHaveLength(0)
  })
})
