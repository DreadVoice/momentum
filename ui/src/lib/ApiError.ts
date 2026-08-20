import type { ApiErrorBody } from '../types/api'

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Readonly<Record<string, string>>
  readonly isNetworkError: boolean

  constructor(
    message: string,
    status: number,
    fieldErrors: Readonly<Record<string, string>> = {},
    isNetworkError = false,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.isNetworkError = isNetworkError
  }

  static network(): ApiError {
    return new ApiError(
      'Cannot reach the server. Check your connection and that the API is running.',
      0,
      {},
      true,
    )
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isRateLimited(): boolean {
    return this.status === 429
  }

  get isNotFound(): boolean {
    return this.status === 404
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readFieldErrors(value: unknown): Readonly<Record<string, string>> {
  if (!isRecord(value)) {
    return {}
  }

  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  )

  return Object.fromEntries(entries)
}

export async function apiErrorFromResponse(response: Response): Promise<ApiError> {
  let body: unknown = null

  try {
    const text = await response.text()
    body = text.length > 0 ? (JSON.parse(text) as unknown) : null
  } catch {
    body = null
  }

  const parsed = isRecord(body) ? (body as Partial<ApiErrorBody>) : null
  const message =
    typeof parsed?.message === 'string' && parsed.message.trim().length > 0
      ? parsed.message
      : defaultMessageFor(response.status)

  return new ApiError(message, response.status, readFieldErrors(parsed?.fieldErrors))
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 400:
      return 'The request was rejected. Please review the values and try again.'
    case 401:
      return 'Your session is no longer valid. Please sign in again.'
    case 403:
      return 'You do not have access to this resource.'
    case 404:
      return 'That resource no longer exists.'
    case 409:
      return 'That value is already taken.'
    case 429:
      return 'Too many attempts. Please wait a minute before trying again.'
    default:
      return 'Something went wrong on the server. Please try again.'
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function toErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  return 'An unexpected error occurred.'
}
