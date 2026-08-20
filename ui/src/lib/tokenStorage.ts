/**
 * Persistence for the JWT pair.
 *
 * The API sets `allowCredentials=false` (see `CorsConfig`), so cookie-based
 * sessions are not available to a cross-origin browser client and the tokens
 * have to be readable by JavaScript. `localStorage` is therefore the deliberate
 * choice: it survives reloads and, unlike an in-memory store, does not force a
 * refresh round-trip on every page load. The trade-off is XSS exposure, which
 * is mitigated by never rendering untrusted HTML.
 */

const ACCESS_TOKEN_KEY = 'momentum.accessToken'
const REFRESH_TOKEN_KEY = 'momentum.refreshToken'

export interface TokenPair {
  readonly accessToken: string
  readonly refreshToken: string
}

/** Storage throws in private-mode Safari and when quotas are exhausted. */
function safeRead(key: string): string | null {
  try {
    const value = window.localStorage.getItem(key)
    return value !== null && value.length > 0 ? value : null
  } catch {
    return null
  }
}

function safeWrite(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* Storage is unavailable; the session degrades to in-tab only. */
  }
}

function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* Nothing further can be done if removal fails. */
  }
}

export const tokenStorage = {
  read(): TokenPair | null {
    const accessToken = safeRead(ACCESS_TOKEN_KEY)
    const refreshToken = safeRead(REFRESH_TOKEN_KEY)

    if (accessToken === null || refreshToken === null) {
      return null
    }

    return { accessToken, refreshToken }
  },

  write(tokens: TokenPair): void {
    safeWrite(ACCESS_TOKEN_KEY, tokens.accessToken)
    safeWrite(REFRESH_TOKEN_KEY, tokens.refreshToken)
  },

  clear(): void {
    safeRemove(ACCESS_TOKEN_KEY)
    safeRemove(REFRESH_TOKEN_KEY)
  },
}
