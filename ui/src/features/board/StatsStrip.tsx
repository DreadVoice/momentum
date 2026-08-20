import { TASK_STATUSES } from '../../types/api'
import { STATUS_LABELS } from './boardConfig'
import type { TaskStatsSummary } from './useTaskStats'

interface StatsStripProps {
  readonly summary: TaskStatsSummary
}

/** Account-wide counters. Independent of the board's current filters. */
export function StatsStrip({ summary }: StatsStripProps) {
  return (
    <dl className="stats">
      {TASK_STATUSES.map((status) => (
        <div key={status} className="stats__item">
          <dt className="micro">{STATUS_LABELS[status]}</dt>
          <dd className="stats__value">{summary.countsByStatus[status]}</dd>
        </div>
      ))}
      <div className="stats__item">
        <dt className="micro">Total</dt>
        <dd className="stats__value">{summary.total}</dd>
      </div>
      <div className="stats__item">
        <dt className="micro">Overdue</dt>
        <dd
          className={
            summary.overdue > 0 ? 'stats__value stats__value--alert' : 'stats__value'
          }
        >
          {summary.overdue}
        </dd>
      </div>
    </dl>
  )
}
