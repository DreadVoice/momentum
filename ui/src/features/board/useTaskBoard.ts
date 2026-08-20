import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { tasksApi } from '../../api/tasksApi'
import { isAbortError, toErrorMessage } from '../../lib/ApiError'
import type {
  TaskCreateRequest,
  TaskQuery,
  TaskResponse,
  TaskStatus,
  TaskUpdateRequest,
} from '../../types/api'

/** The board needs every matching task, so it pages well above the API default of 20. */
const PAGE_SIZE = 100

export type BoardStatus = 'loading' | 'ready' | 'error'

export type TasksByStatus = Readonly<Record<TaskStatus, readonly TaskResponse[]>>

export interface UseTaskBoardResult {
  readonly status: BoardStatus
  readonly tasksByStatus: TasksByStatus
  readonly totalElements: number
  readonly loadedCount: number
  readonly hasMore: boolean
  readonly isLoadingMore: boolean
  readonly isRefreshing: boolean
  readonly error: string | null
  readonly mutationError: string | null
  readonly pendingTaskId: number | null
  readonly refresh: () => void
  readonly reloadTask: (taskId: number) => void
  readonly loadMore: () => void
  readonly createTask: (body: TaskCreateRequest) => Promise<void>
  readonly updateTask: (taskId: number, body: TaskUpdateRequest) => Promise<void>
  readonly moveTask: (taskId: number, status: TaskStatus) => Promise<void>
  readonly deleteTask: (taskId: number) => Promise<void>
  readonly dismissMutationError: () => void
}

function emptyBuckets(): Record<TaskStatus, TaskResponse[]> {
  return {
    PENDING: [],
    IN_PROGRESS: [],
    COMPLETED: [],
  }
}

/**
 * Owns every server interaction for the board: the paged fetch driven by the
 * nav-bar query, and the mutations reachable from a card.
 *
 * Pages accumulate into a single list which is then bucketed by status, so the
 * server-side sort is preserved inside each column.
 */
export function useTaskBoard(query: TaskQuery): UseTaskBoardResult {
  const [tasks, setTasks] = useState<readonly TaskResponse[]>([])
  const [status, setStatus] = useState<BoardStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [pendingTaskId, setPendingTaskId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  // Bumping this re-runs the fetch effect without changing the query identity.
  const [reloadToken, setReloadToken] = useState(0)

  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // A change of filter or sort invalidates the accumulated pages entirely.
  // Adjusting during render (rather than in an effect) means the fetch effect
  // below only ever runs once, with the reset page, instead of firing a request
  // for the stale page and immediately aborting it.
  const [appliedQuery, setAppliedQuery] = useState<TaskQuery>(query)

  if (appliedQuery !== query) {
    setAppliedQuery(query)
    setPage(0)
    setTasks([])
    setStatus('loading')
  }

  useEffect(() => {
    const controller = new AbortController()
    const isFirstPage = page === 0

    if (isFirstPage) {
      setIsRefreshing(true)
    } else {
      setIsLoadingMore(true)
    }

    tasksApi
      .list({ query, page, size: PAGE_SIZE, signal: controller.signal })
      .then((response) => {
        if (!mountedRef.current) {
          return
        }
        // Replacing on page 0 also covers the refresh case; later pages append.
        setTasks((current) =>
          isFirstPage ? response.content : [...current, ...response.content],
        )
        setTotalElements(response.totalElements)
        setTotalPages(response.totalPages)
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
      .finally(() => {
        if (!mountedRef.current) {
          return
        }
        setIsRefreshing(false)
        setIsLoadingMore(false)
      })

    return () => {
      controller.abort()
    }
  }, [query, page, reloadToken])

  const tasksByStatus = useMemo<TasksByStatus>(() => {
    const buckets = emptyBuckets()

    for (const task of tasks) {
      // Defensive: an unknown status from a newer API version must not throw.
      const bucket = buckets[task.status]
      if (bucket !== undefined) {
        bucket.push(task)
      }
    }

    return buckets
  }, [tasks])

  const refresh = useCallback(() => {
    setPage(0)
    setReloadToken((token) => token + 1)
  }, [])

  const loadMore = useCallback(() => {
    setPage((current) => {
      const next = current + 1
      return next < totalPages ? next : current
    })
  }, [totalPages])

  /**
   * Mutations re-read the affected task from the API response rather than
   * optimistically guessing, because the server owns derived fields such as
   * `updatedAt` and the completed-subtask counters.
   */
  const runMutation = useCallback(
    async (taskId: number | null, operation: () => Promise<void>): Promise<void> => {
      setPendingTaskId(taskId)
      setMutationError(null)

      try {
        await operation()
      } catch (cause: unknown) {
        if (!isAbortError(cause) && mountedRef.current) {
          setMutationError(toErrorMessage(cause))
        }
        throw cause
      } finally {
        if (mountedRef.current) {
          setPendingTaskId(null)
        }
      }
    },
    [],
  )

  const replaceTask = useCallback((updated: TaskResponse) => {
    setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)))
  }, [])

  /**
   * Re-reads one task after a change made outside the board, such as adding or
   * completing a subtask, so its counters stay accurate without refetching the
   * whole page. A failure is silent: the counters are cosmetic.
   */
  const reloadTask = useCallback(
    (taskId: number) => {
      tasksApi
        .get(taskId)
        .then((updated) => {
          if (mountedRef.current) {
            replaceTask(updated)
          }
        })
        .catch(() => undefined)
    },
    [replaceTask],
  )

  const createTask = useCallback(
    (body: TaskCreateRequest): Promise<void> =>
      runMutation(null, async () => {
        const created = await tasksApi.create(body)
        if (!mountedRef.current) {
          return
        }
        // Prepending keeps the new task visible even under a sort that would
        // place it further down; the next refresh restores the true order.
        setTasks((current) => [created, ...current])
        setTotalElements((current) => current + 1)
      }),
    [runMutation],
  )

  const updateTask = useCallback(
    (taskId: number, body: TaskUpdateRequest): Promise<void> =>
      runMutation(taskId, async () => {
        const updated = await tasksApi.update(taskId, body)
        if (mountedRef.current) {
          replaceTask(updated)
        }
      }),
    [runMutation, replaceTask],
  )

  const moveTask = useCallback(
    (taskId: number, nextStatus: TaskStatus): Promise<void> =>
      runMutation(taskId, async () => {
        const updated = await tasksApi.patch(taskId, { status: nextStatus })
        if (mountedRef.current) {
          replaceTask(updated)
        }
      }),
    [runMutation, replaceTask],
  )

  const deleteTask = useCallback(
    (taskId: number): Promise<void> =>
      runMutation(taskId, async () => {
        await tasksApi.remove(taskId)
        if (!mountedRef.current) {
          return
        }
        setTasks((current) => current.filter((task) => task.id !== taskId))
        setTotalElements((current) => Math.max(0, current - 1))
      }),
    [runMutation],
  )

  const dismissMutationError = useCallback(() => {
    setMutationError(null)
  }, [])

  const loadedCount = tasks.length

  return {
    status,
    tasksByStatus,
    totalElements,
    loadedCount,
    hasMore: page + 1 < totalPages,
    isLoadingMore,
    isRefreshing,
    error,
    mutationError,
    pendingTaskId,
    refresh,
    reloadTask,
    loadMore,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    dismissMutationError,
  }
}
