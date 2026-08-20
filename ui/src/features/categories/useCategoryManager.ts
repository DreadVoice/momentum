import { useCallback, useEffect, useRef, useState } from 'react'
import { categoriesApi } from '../../api/categoriesApi'
import { isAbortError, toErrorMessage } from '../../lib/ApiError'
import type { CategoryResponse } from '../../types/api'

export type CategoriesStatus = 'loading' | 'ready' | 'error'

export interface UseCategoryManagerResult {
  readonly categories: readonly CategoryResponse[]
  readonly status: CategoriesStatus
  readonly error: string | null
  readonly mutationError: string | null
  readonly pendingId: number | null
  readonly isCreating: boolean
  readonly reload: () => void
  readonly create: (name: string) => Promise<void>
  readonly rename: (categoryId: number, name: string) => Promise<void>
  readonly remove: (categoryId: number) => Promise<void>
  readonly dismissMutationError: () => void
}

/** Full CRUD over the account's categories. */
export function useCategoryManager(): UseCategoryManagerResult {
  const [categories, setCategories] = useState<readonly CategoryResponse[]>([])
  const [status, setStatus] = useState<CategoriesStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')

    categoriesApi
      .list(controller.signal)
      .then((response) => {
        if (!mountedRef.current) {
          return
        }
        setCategories(response)
        setError(null)
        setStatus('ready')
      })
      .catch((cause: unknown) => {
        if (isAbortError(cause) || !mountedRef.current) {
          return
        }
        setError(toErrorMessage(cause))
        setStatus('error')
      })

    return () => {
      controller.abort()
    }
  }, [reloadToken])

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1)
  }, [])

  const dismissMutationError = useCallback(() => {
    setMutationError(null)
  }, [])

  const create = useCallback(async (name: string): Promise<void> => {
    const trimmed = name.trim()

    if (trimmed.length === 0) {
      return
    }

    setIsCreating(true)
    setMutationError(null)

    try {
      const created = await categoriesApi.create({ name: trimmed })
      if (mountedRef.current) {
        setCategories((current) => [...current, created])
      }
    } catch (cause: unknown) {
      if (mountedRef.current) {
        setMutationError(toErrorMessage(cause))
      }
      throw cause
    } finally {
      if (mountedRef.current) {
        setIsCreating(false)
      }
    }
  }, [])

  const runOn = useCallback(
    async (categoryId: number, operation: () => Promise<void>): Promise<void> => {
      setPendingId(categoryId)
      setMutationError(null)

      try {
        await operation()
      } catch (cause: unknown) {
        if (mountedRef.current) {
          setMutationError(toErrorMessage(cause))
        }
        throw cause
      } finally {
        if (mountedRef.current) {
          setPendingId(null)
        }
      }
    },
    [],
  )

  const rename = useCallback(
    (categoryId: number, name: string): Promise<void> =>
      runOn(categoryId, async () => {
        const updated = await categoriesApi.update(categoryId, { name: name.trim() })
        if (mountedRef.current) {
          setCategories((current) =>
            current.map((category) => (category.id === categoryId ? updated : category)),
          )
        }
      }),
    [runOn],
  )

  const remove = useCallback(
    (categoryId: number): Promise<void> =>
      runOn(categoryId, async () => {
        await categoriesApi.remove(categoryId)
        if (mountedRef.current) {
          setCategories((current) => current.filter((category) => category.id !== categoryId))
        }
      }),
    [runOn],
  )

  return {
    categories,
    status,
    error,
    mutationError,
    pendingId,
    isCreating,
    reload,
    create,
    rename,
    remove,
    dismissMutationError,
  }
}
