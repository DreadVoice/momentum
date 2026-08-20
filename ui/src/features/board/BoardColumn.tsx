import type { TaskResponse, TaskStatus } from '../../types/api'
import { EMPTY_COLUMN_MESSAGES, STATUS_LABELS } from './boardConfig'
import { TaskCard } from './TaskCard'

interface BoardColumnProps {
  readonly status: TaskStatus
  readonly tasks: readonly TaskResponse[]
  readonly pendingTaskId: number | null
  readonly selectedTaskId: number | null
  readonly onSelect: (task: TaskResponse) => void
  readonly onEdit: (task: TaskResponse) => void
  readonly onMove: (taskId: number, status: TaskStatus) => void
  readonly onDelete: (task: TaskResponse) => void
}

/** One of the three boards. Presentational: it renders whatever it is given. */
export function BoardColumn({
  status,
  tasks,
  pendingTaskId,
  selectedTaskId,
  onSelect,
  onEdit,
  onMove,
  onDelete,
}: BoardColumnProps) {
  const isEmpty = tasks.length === 0

  return (
    <section className="board-column" aria-labelledby={`column-${status}`}>
      <header className="board-column__header">
        <h2 id={`column-${status}`} className="board-column__title">
          {STATUS_LABELS[status]}
        </h2>
        <span className="board-column__count" aria-label={`${tasks.length} tasks`}>
          {tasks.length}
        </span>
      </header>

      <div className="board-column__body">
        {isEmpty ? (
          <p className="board-column__empty">{EMPTY_COLUMN_MESSAGES[status]}</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isPending={pendingTaskId === task.id}
              isSelected={selectedTaskId === task.id}
              onSelect={onSelect}
              onEdit={onEdit}
              onMove={onMove}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </section>
  )
}
