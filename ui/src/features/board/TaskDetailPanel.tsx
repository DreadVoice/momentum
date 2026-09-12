import { PencilIcon, Trash2Icon, XIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useCallback } from 'react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Separator } from '../../components/ui/separator'
import { formatDueDate, formatTimestamp, isOverdue } from '../../lib/date'
import { cn } from '../../lib/utils'
import { TASK_STATUSES, type TaskResponse, type TaskStatus } from '../../types/api'
import {
  PRIORITY_BADGE_VARIANTS,
  PRIORITY_LABELS,
  STATUS_DOT_CLASSES,
  STATUS_LABELS,
} from './boardConfig'
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

interface MetaRowProps {
  readonly label: string
  readonly children: React.ReactNode
}

function MetaRow({ label, children }: MetaRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-xs wrap-anywhere">{children}</dd>
    </div>
  )
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
    <motion.aside
      key={task.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      aria-label={`Details for ${task.title}`}
      className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs xl:sticky xl:top-[4.5rem] xl:max-h-[calc(100dvh-6rem)]"
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-2.5">
        <span className="tabular text-xs font-medium text-muted-foreground">
          Task #{task.id}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close details"
          className="text-muted-foreground"
        >
          <XIcon />
        </Button>
      </header>

      <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-base leading-snug wrap-anywhere">{task.title}</h2>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={PRIORITY_BADGE_VARIANTS[task.priority]}>
              {PRIORITY_LABELS[task.priority]}
            </Badge>
            {task.categoryName !== null && (
              <Badge variant="outline">{task.categoryName}</Badge>
            )}
            {overdue && <Badge variant="destructive">Overdue</Badge>}
          </div>
        </div>

        {task.description !== null && task.description.trim().length > 0 ? (
          <p className="text-sm leading-relaxed wrap-anywhere text-muted-foreground">
            {task.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/70 italic">No description.</p>
        )}

        <Separator />

        <dl className="divide-y">
          <MetaRow label="Board">{STATUS_LABELS[task.status]}</MetaRow>
          <MetaRow label="Category">{task.categoryName ?? '—'}</MetaRow>
          <MetaRow label="Due">
            <span className={cn('tabular', overdue && 'font-medium text-destructive')}>
              {task.dueDate === null ? '—' : formatDueDate(task.dueDate)}
            </span>
          </MetaRow>
          <MetaRow label="Created">
            <span className="tabular text-muted-foreground">
              {formatTimestamp(task.createdAt)}
            </span>
          </MetaRow>
          <MetaRow label="Updated">
            <span className="tabular text-muted-foreground">
              {formatTimestamp(task.updatedAt)}
            </span>
          </MetaRow>
        </dl>

        <Separator />

        <SubTaskList taskId={task.id} onChanged={onSubTasksChanged} />

        <Separator />

        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-medium text-muted-foreground">Move to</h3>
          <div className="flex flex-wrap gap-1.5">
            {TASK_STATUSES.map((candidate) => {
              const isCurrent = candidate === task.status

              return (
                <Button
                  key={candidate}
                  type="button"
                  variant={isCurrent ? 'secondary' : 'outline'}
                  size="sm"
                  disabled={isPending || isCurrent}
                  onClick={() => {
                    onMove(task.id, candidate)
                  }}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'size-1.5 shrink-0 rounded-full',
                      STATUS_DOT_CLASSES[candidate],
                    )}
                  />
                  {STATUS_LABELS[candidate]}
                  {isCurrent && <span className="sr-only">(current board)</span>}
                </Button>
              )
            })}
          </div>
        </section>
      </div>

      <footer className="flex shrink-0 items-center gap-2 border-t px-4 py-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleEdit}
          disabled={isPending}
        >
          <PencilIcon />
          Edit task
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2Icon />
          Delete
        </Button>
      </footer>
    </motion.aside>
  )
}
