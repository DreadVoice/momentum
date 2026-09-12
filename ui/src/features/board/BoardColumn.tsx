import { useDroppable } from '@dnd-kit/core'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../../lib/utils'
import type { TaskResponse, TaskStatus } from '../../types/api'
import { EMPTY_COLUMN_MESSAGES, STATUS_DOT_CLASSES, STATUS_LABELS } from './boardConfig'
import { TaskCard } from './TaskCard'

interface BoardColumnProps {
  readonly status: TaskStatus
  readonly tasks: readonly TaskResponse[]
  readonly pendingTaskId: number | null
  readonly selectedTaskId: number | null
  readonly isDragActive: boolean
  readonly onSelect: (task: TaskResponse) => void
  readonly onEdit: (task: TaskResponse) => void
  readonly onMove: (taskId: number, status: TaskStatus) => void
  readonly onDelete: (task: TaskResponse) => void
}

export function BoardColumn({
  status,
  tasks,
  pendingTaskId,
  selectedTaskId,
  isDragActive,
  onSelect,
  onEdit,
  onMove,
  onDelete,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const isEmpty = tasks.length === 0

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={`column-${status}`}
      className={cn(
        'flex min-w-0 flex-col gap-2.5 rounded-xl border bg-muted/40 p-2.5 transition-colors',
        isDragActive && 'border-dashed',
        isOver && 'border-brand bg-brand-subtle/50',
      )}
    >
      <header className="flex items-center justify-between gap-2 px-1 pt-0.5">
        <h2
          id={`column-${status}`}
          className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-muted-foreground"
        >
          <span
            aria-hidden="true"
            className={cn('size-2 shrink-0 rounded-full', STATUS_DOT_CLASSES[status])}
          />
          {STATUS_LABELS[status]}
        </h2>
        <span
          className="tabular rounded-md bg-background px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
          aria-label={`${tasks.length} tasks`}
        >
          {tasks.length}
        </span>
      </header>

      <div className="flex min-h-16 flex-col gap-2">
        {isEmpty ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
            {isDragActive ? 'Drop here' : EMPTY_COLUMN_MESSAGES[status]}
          </p>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              >
                <TaskCard
                  task={task}
                  isPending={pendingTaskId === task.id}
                  isSelected={selectedTaskId === task.id}
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onMove={onMove}
                  onDelete={onDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </section>
  )
}
