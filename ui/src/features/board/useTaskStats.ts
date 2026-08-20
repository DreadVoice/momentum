import { useEffect, useState } from 'react'
import { tasksApi } from '../../api/tasksApi'
import { isAbortError } from '../../lib/ApiError'
import type { TaskStatsResponse, TaskStatus } from '../../types/api'

export interface TaskStatsSummary {
  readonly countsByStatus: Readonly<Record<TaskStatus, number>>
  readonly total: number
  readonly overdue: number
}

export interface UseTaskStatsResult {
  readonly summary: TaskStatsSummary | null
  readonly isLoading: boolean
}

const EMPTY_COUNTS: Readonly<Record<TaskStatus, number>> = {
  PENDING: 0,
  IN_PROGRESS: 0,
  COMPLETED: 0,
}

/**
 * Account-wide totals from `/api/tasks/stats` plus the overdue list length.
 * These are unaffected by the board's filters, so the numbers describe the
 * whole account rather than the current view.
 *
 * `revision` is bumped by the caller after a mutation to re-read the counts.
 */
export function useTaskStats(revision: number): UseTaskStatsResult {
  const [summary, setSummary] = useState<TaskStatsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    let isActive = true

    // Both are non-critical: a failure leaves the strip hidden rather than
    // interrupting the board.
    Promise.all([
      tasksApi.stats(controller.signal),
      tasksApi.overdue(controller.signal),
    ])
      .then(([stats, overdue]: [TaskStatsResponse, readonly unknown[]]) => {
        if (!isActive) {
          return
        }
        setSummary({
          countsByStatus: { ...EMPTY_COUNTS, ...stats.countsByStatus },
          total: stats.total,
          overdue: overdue.length,
        })
      })
      .catch((error: unknown) => {
        if (!isAbortError(error) && isActive) {
          setSummary(null)
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
  }, [revision])

  return { summary, isLoading }
}
