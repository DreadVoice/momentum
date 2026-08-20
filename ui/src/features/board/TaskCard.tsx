import { memo } from 'react'
import { Spinner } from '../../components/common/Spinner'
import { formatDueDate, isOverdue } from '../../lib/date'
import type { TaskResponse, TaskStatus } from '../../types/api'
import { PRIORITY_LABELS } from './boardConfig'
import { TaskCardMenu } from './TaskCardMenu'

interface TaskCardProps {
  readonly task: TaskResponse
  readonly isPending: boolean
  readonly onEdit: (task: TaskResponse) => void
  readonly onMove: (taskId: number, status: TaskStatus) => void
  readonly onDelete: (task: TaskResponse) => void
}

/**
 * Presentational card. Receives everything it renders and owns no state, so it
 * is safe to memoise: the parent passes stable `useCallback` handlers.
 */
function TaskCardComponent({ task, isPending, onEdit, onMove, onDelete }: TaskCardProps) {
  const overdue = isOverdue(task.dueDate) && task.status !== 'COMPLETED'
  const hasSubTasks = task.subTaskCount > 0

  return (
    <article className={isPending ? 'task-card task-card--pending' : 'task-card'}>
      <header className="task-card__header">
        <h3 className="task-card__title">{task.title}</h3>
        {isPending ? (
          <Spinner label={`Updating ${task.title}`} size="sm" />
        ) : (
          <TaskCardMenu
            task={task}
            disabled={isPending}
            onEdit={onEdit}
            onMove={onMove}
            onDelete={onDelete}
          />
        )}
      </header>

      {task.description !== null && task.description.trim().length > 0 && (
        <p className="task-card__description">{task.description}</p>
      )}

      <footer className="task-card__meta">
        <span className={`badge badge--priority-${task.priority.toLowerCase()}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>

        {task.categoryName !== null && <span className="badge">{task.categoryName}</span>}

        {task.dueDate !== null && (
          <span className={overdue ? 'badge badge--overdue' : 'badge'}>
            {overdue ? 'Overdue · ' : 'Due '}
            {formatDueDate(task.dueDate)}
          </span>
        )}

        {hasSubTasks && (
          <span className="badge">
            {task.completedSubTaskCount}/{task.subTaskCount} subtasks
          </span>
        )}
      </footer>
    </article>
  )
}

export const TaskCard = memo(TaskCardComponent)
