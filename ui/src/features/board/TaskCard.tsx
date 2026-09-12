import { useDraggable } from '@dnd-kit/core'
import { CalendarClockIcon, GripVerticalIcon, ListChecksIcon } from 'lucide-react'
import { memo } from 'react'
import { Spinner } from '../../components/common/Spinner'
import { Badge } from '../../components/ui/badge'
import { formatDueDate, isOverdue } from '../../lib/date'
import { cn } from '../../lib/utils'
import type { TaskResponse, TaskStatus } from '../../types/api'
import { PRIORITY_BADGE_VARIANTS, PRIORITY_LABELS } from './boardConfig'
import { TaskCardMenu } from './TaskCardMenu'

interface TaskCardProps {
  readonly task: TaskResponse
  readonly isPending: boolean
  readonly isSelected: boolean
  readonly onSelect: (task: TaskResponse) => void
  readonly onEdit: (task: TaskResponse) => void
  readonly onMove: (taskId: number, status: TaskStatus) => void
  readonly onDelete: (task: TaskResponse) => void
}

/**
 * The card body, shared by the interactive board card and the drag overlay.
 * Kept presentational so the overlay never re-registers drag listeners.
 */
export function TaskCardBody({
  task,
  isPending,
  isSelected,
  isDragging = false,
  isOverlay = false,
  onSelect,
  onEdit,
  onMove,
  onDelete,
  dragHandle,
}: TaskCardProps & {
  readonly isDragging?: boolean
  readonly isOverlay?: boolean
  readonly dragHandle?: React.ReactNode
}) {
  const overdue = isOverdue(task.dueDate) && task.status !== 'COMPLETED'
  const hasSubTasks = task.subTaskCount > 0
  const isDone = task.status === 'COMPLETED'

  return (
    <article
      className={cn(
        'group/card relative flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-xs transition-[border-color,box-shadow,opacity]',
        'hover:border-foreground/20 hover:shadow-sm',
        isSelected && 'border-brand ring-1 ring-brand/30',
        isPending && 'opacity-55',
        isDragging && 'opacity-40',
        isOverlay && 'rotate-1 cursor-grabbing border-brand/50 shadow-lg',
      )}
    >
      <header className="flex items-start justify-between gap-1.5">
        {dragHandle}

        <button
          type="button"
          aria-pressed={isSelected}
          className={cn(
            'min-w-0 flex-1 rounded-sm text-left text-sm font-medium wrap-anywhere transition-colors',
            'hover:text-brand focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none',
            isDone && 'text-muted-foreground line-through decoration-muted-foreground/40',
          )}
          onClick={() => {
            onSelect(task)
          }}
        >
          {task.title}
        </button>

        {isPending ? (
          <Spinner
            label={`Updating ${task.title}`}
            size="sm"
            className="mt-0.5 text-muted-foreground"
          />
        ) : (
          !isOverlay && (
            <TaskCardMenu
              task={task}
              disabled={isPending}
              onEdit={onEdit}
              onMove={onMove}
              onDelete={onDelete}
            />
          )
        )}
      </header>

      {task.description !== null && task.description.trim().length > 0 && (
        <p className="line-clamp-2 text-xs leading-relaxed wrap-anywhere text-muted-foreground">
          {task.description}
        </p>
      )}

      <footer className="flex flex-wrap items-center gap-1.5">
        <Badge variant={PRIORITY_BADGE_VARIANTS[task.priority]}>
          {PRIORITY_LABELS[task.priority]}
        </Badge>

        {task.categoryName !== null && <Badge variant="outline">{task.categoryName}</Badge>}

        {task.dueDate !== null && (
          <Badge variant={overdue ? 'destructive' : 'outline'} className="tabular">
            <CalendarClockIcon aria-hidden="true" />
            {overdue ? 'Overdue · ' : ''}
            {formatDueDate(task.dueDate)}
          </Badge>
        )}

        {hasSubTasks && (
          <Badge
            variant={
              task.completedSubTaskCount === task.subTaskCount ? 'success' : 'outline'
            }
            className="tabular"
          >
            <ListChecksIcon aria-hidden="true" />
            {task.completedSubTaskCount}/{task.subTaskCount}
          </Badge>
        )}
      </footer>
    </article>
  )
}

function TaskCardComponent(props: TaskCardProps) {
  const { task, isPending } = props

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status, title: task.title },
    disabled: isPending,
  })

  return (
    <div ref={setNodeRef}>
      <TaskCardBody
        {...props}
        isDragging={isDragging}
        dragHandle={
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Drag ${task.title} to another board`}
            className={cn(
              '-ml-1 mt-0.5 shrink-0 cursor-grab touch-none rounded-sm p-0.5 text-muted-foreground/40 transition-[color,opacity]',
              'hover:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none',
              'opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100',
              isPending && 'pointer-events-none',
            )}
          >
            <GripVerticalIcon className="size-3.5" aria-hidden="true" />
          </button>
        }
      />
    </div>
  )
}

export const TaskCard = memo(TaskCardComponent)
