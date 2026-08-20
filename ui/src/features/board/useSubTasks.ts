import { useCallback, useEffect, useRef, useState } from 'react'
import { subTasksApi } from '../../api/subTasksApi'
import { isAbortError, toErrorMessage } from '../../lib/ApiError'
import type { SubTaskResponse } from '../../types/api'

export type SubTasksStatus = 'loading' | 'ready' | 'error'

export interface UseSubTasksResult {
  readonly subTasks: readonly SubTaskResponse[]
  readonly status: SubTasksStatus
  readonly error: string | null
  readonly pendingId: number | null
  readonly isCreating: boolean
  readonly reload: () => void
  readonly add: (title: string) => Promise<void>
  readonly toggle: (subTaskId: number) => Promise<void>
  readonly rename: (subTask: SubTaskResponse, title: string) => Promise<void>
  readonly remove: (subTaskId: number) => Promise<void>
  readonly dismissError: () => void
}

/**
 * Subtasks for one task. Kept separate from the board hook because the list is
 * only fetched when a task is opened, and its mutations do not invalidate the
 * board beyond the counters the caller refreshes.
 */
export function useSubTasks(taskId: number): UseSubTasksResult {
  const [subTasks, setSubTasks] = useState<readonly SubTaskResponse[]>([])
  const [status, setStatus] = useState<SubTasksStatus>('loading')
  const [error, setError] = useState<string | null>(null)
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

    subTasksApi
      .list(taskId, controller.signal)
      .then((response) => {
        if (!mountedRef.current) {
          return
        }
        setSubTasks(response)
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
  }, [taskId, reloadToken])

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1)
  }, [])

  const dismissError = useCallback(() => {
    setError(null)
  }, [])

  const replace = useCallback((updated: SubTaskResponse) => {
    setSubTasks((current) =>
      current.map((subTask) => (subTask.id === updated.id ? updated : subTask)),
    )
  }, [])

  const add = useCallback(
    async (title: string): Promise<void> => {
      const trimmed = title.trim()

      if (trimmed.length === 0) {
        return
      }

      setIsCreating(true)
      setError(null)

      try {
        const created = await subTasksApi.create(taskId, { title: trimmed })
        if (mountedRef.current) {
          setSubTasks((current) => [...current, created])
        }
      } catch (cause: unknown) {
        if (mountedRef.current) {
          setError(toErrorMessage(cause))
        }
        throw cause
      } finally {
        if (mountedRef.current) {
          setIsCreating(false)
        }
      }
    },
    [taskId],
  )

  const runOn = useCallback(
    async (subTaskId: number, operation: () => Promise<void>): Promise<void> => {
      setPendingId(subTaskId)
      setError(null)

      try {
        await operation()
      } catch (cause: unknown) {
        if (mountedRef.current) {
          setError(toErrorMessage(cause))
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

  const toggle = useCallback(
    (subTaskId: number): Promise<void> =>
      // The dedicated toggle endpoint flips server-side, so a stale local
      // `completed` value can never be written back.
      runOn(subTaskId, async () => {
        const updated = await subTasksApi.toggle(subTaskId)
        if (mountedRef.current) {
          replace(updated)
        }
      }),
    [runOn, replace],
  )

  const rename = useCallback(
    (subTask: SubTaskResponse, title: string): Promise<void> =>
      runOn(subTask.id, async () => {
        const updated = await subTasksApi.patch(subTask.id, { title: title.trim() })
        if (mountedRef.current) {
          replace(updated)
        }
      }),
    [runOn, replace],
  )

  const remove = useCallback(
    (subTaskId: number): Promise<void> =>
      runOn(subTaskId, async () => {
        await subTasksApi.remove(subTaskId)
        if (mountedRef.current) {
          setSubTasks((current) => current.filter((subTask) => subTask.id !== subTaskId))
        }
      }),
    [runOn],
  )

  return {
    subTasks,
    status,
    error,
    pendingId,
    isCreating,
    reload,
    add,
    toggle,
    rename,
    remove,
    dismissError,
  }
}
