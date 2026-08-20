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


export function useTaskStats(revision: number): UseTaskStatsResult {
  const [summary, setSummary] = useState<TaskStatsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    let isActive = true

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
