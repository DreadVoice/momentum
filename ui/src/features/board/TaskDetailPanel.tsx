import { useCallback } from 'react'
import { formatDueDate, formatTimestamp, isOverdue } from '../../lib/date'
import { TASK_STATUSES, type TaskResponse, type TaskStatus } from '../../types/api'
import { PRIORITY_LABELS, STATUS_LABELS } from './boardConfig'
import { SubTaskList } from './SubTaskList'

interface TaskDetailPanelProps {
  readonly task: TaskResponse
  readonly isPending: boolean
  readonly onEdit: (task: TaskResponse) => void
  readonly onMove: (taskId: number, status: TaskStatus) => void
  readonly onDelete: (task: TaskResponse) => void
  readonly onSubTasksChanged: () => void
  readonly onClose: () => void
}

export function TaskDetailPanel({
  task,
  isPending,
  onEdit,
  onMove,
  onDelete,
  onSubTasksChanged,
  onClose,
}: TaskDetailPanelProps) {
  const overdue = isOverdue(task.dueDate) && task.status !== 'COMPLETED'

  const handleEdit = useCallback(() => {
    onEdit(task)
  }, [onEdit, task])

  const handleDelete = useCallback(() => {
    onDelete(task)
  }, [onDelete, task])

  return (
    <aside className="detail" aria-label={`Details for ${task.title}`}>
      <header className="detail__header">
        <span className="micro">Task {task.id}</span>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close details">
          &#10005;
        </button>
      </header>

      <div className="detail__body">
        <h2 className="detail__title">{task.title}</h2>

        {task.description !== null && task.description.trim().length > 0 ? (
          <p className="detail__description">{task.description}</p>
        ) : (
          <p className="detail__description display-accent">No description.</p>
        )}

        <dl className="detail__meta">
          <div>
            <dt className="micro">Board</dt>
            <dd className="meta">{STATUS_LABELS[task.status]}</dd>
          </div>
          <div>
            <dt className="micro">Priority</dt>
            <dd className="meta">{PRIORITY_LABELS[task.priority]}</dd>
          </div>
          <div>
            <dt className="micro">Category</dt>
            <dd className="meta">{task.categoryName ?? '—'}</dd>
          </div>
          <div>
            <dt className="micro">Due</dt>
            <dd className={overdue ? 'meta detail__meta--overdue' : 'meta'}>
              {task.dueDate === null ? '—' : formatDueDate(task.dueDate)}
              {overdue && ' · overdue'}
            </dd>
          </div>
          <div>
            <dt className="micro">Created</dt>
            <dd className="meta">{formatTimestamp(task.createdAt)}</dd>
          </div>
          <div>
            <dt className="micro">Updated</dt>
            <dd className="meta">{formatTimestamp(task.updatedAt)}</dd>
          </div>
        </dl>

        <div className="detail__divider" role="presentation" />

        <SubTaskList taskId={task.id} onChanged={onSubTasksChanged} />

        <div className="detail__divider" role="presentation" />

        <section className="detail__move">
          <h3 className="micro">Move to</h3>
          <div className="detail__move-buttons">
            {TASK_STATUSES.map((candidate) => (
              <button
                key={candidate}
                type="button"
                className="m-oauth m-sm"
                disabled={isPending || candidate === task.status}
                onClick={() => {
                  onMove(task.id, candidate)
                }}
              >
                {STATUS_LABELS[candidate]}
              </button>
            ))}
          </div>
        </section>
      </div>

      <footer className="detail__footer">
        <button type="button" className="m-oauth" onClick={handleEdit} disabled={isPending}>
          Edit task
        </button>
        <button
          type="button"
          className="m-oauth m-danger"
          onClick={handleDelete}
          disabled={isPending}
        >
          Delete
        </button>
      </footer>
    </aside>
  )
}
