import { useEffect, useState } from 'react'
import { categoriesApi } from '../../api/categoriesApi'
import { isAbortError } from '../../lib/ApiError'
import type { CategoryResponse } from '../../types/api'

export interface UseCategoriesResult {
  readonly categories: readonly CategoryResponse[]
  readonly isLoading: boolean
  /** True when the list could not be loaded; filtering degrades, nothing breaks. */
  readonly hasFailed: boolean
}

/**
 * Loads the account's categories for the nav-bar filter. A failure here is
 * non-fatal: the board still renders, only the category filter is unavailable.
 */
export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<readonly CategoryResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasFailed, setHasFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let isActive = true

    categoriesApi
      .list(controller.signal)
      .then((response) => {
        if (isActive) {
          setCategories(response)
          setHasFailed(false)
        }
      })
      .catch((error: unknown) => {
        if (!isAbortError(error) && isActive) {
          setHasFailed(true)
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
      controller.abort()
    }
  }, [])

  return { categories, isLoading, hasFailed }
}
