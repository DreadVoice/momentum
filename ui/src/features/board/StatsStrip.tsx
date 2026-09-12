import { AlertTriangleIcon } from 'lucide-react'
import { TASK_STATUSES } from '../../types/api'
import { cn } from '../../lib/utils'
import { STATUS_DOT_CLASSES, STATUS_LABELS } from './boardConfig'
import type { TaskStatsSummary } from './useTaskStats'

interface StatsStripProps {
  readonly summary: TaskStatsSummary
}

export function StatsStrip({ summary }: StatsStripProps) {
  const hasOverdue = summary.overdue > 0

  return (
    <dl className="grid grid-cols-2 gap-px border-b bg-border sm:grid-cols-3 lg:grid-cols-5">
      {TASK_STATUSES.map((status) => (
        <div key={status} className="flex flex-col gap-0.5 bg-background px-4 py-3 sm:px-6">
          <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span
              aria-hidden="true"
              className={cn('size-1.5 shrink-0 rounded-full', STATUS_DOT_CLASSES[status])}
            />
            {STATUS_LABELS[status]}
          </dt>
          <dd className="tabular text-2xl font-semibold tracking-tight">
            {summary.countsByStatus[status]}
          </dd>
        </div>
      ))}

      <div className="flex flex-col gap-0.5 bg-background px-4 py-3 sm:px-6">
        <dt className="text-xs font-medium text-muted-foreground">Total</dt>
        <dd className="tabular text-2xl font-semibold tracking-tight">{summary.total}</dd>
      </div>

      <div className="flex flex-col gap-0.5 bg-background px-4 py-3 max-sm:col-span-2 sm:px-6">
        <dt
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium',
            hasOverdue ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {hasOverdue && <AlertTriangleIcon className="size-3" aria-hidden="true" />}
          Overdue
        </dt>
        <dd
          className={cn(
            'tabular text-2xl font-semibold tracking-tight',
            hasOverdue && 'text-destructive',
          )}
        >
          {summary.overdue}
        </dd>
      </div>
    </dl>
  )
}
