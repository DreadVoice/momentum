const ACCESS_TOKEN_KEY = 'momentum.accessToken'
const REFRESH_TOKEN_KEY = 'momentum.refreshToken'

export interface TokenPair {
  readonly accessToken: string
  readonly refreshToken: string
}

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
  }
}

function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
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
