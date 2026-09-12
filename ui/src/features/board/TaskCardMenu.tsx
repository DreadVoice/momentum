import { MoreVerticalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useCallback } from 'react'
import { Button } from '../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { TASK_STATUSES, type TaskResponse, type TaskStatus } from '../../types/api'
import { STATUS_DOT_CLASSES, STATUS_LABELS } from './boardConfig'

interface TaskCardMenuProps {
  readonly task: TaskResponse
  readonly disabled: boolean
  readonly onEdit: (task: TaskResponse) => void
  readonly onMove: (taskId: number, status: TaskStatus) => void
  readonly onDelete: (task: TaskResponse) => void
}

export function TaskCardMenu({
  task,
  disabled,
  onEdit,
  onMove,
  onDelete,
}: TaskCardMenuProps) {
  const handleEdit = useCallback(() => {
    onEdit(task)
  }, [onEdit, task])

  const handleDelete = useCallback(() => {
    onDelete(task)
  }, [onDelete, task])

  const otherStatuses = TASK_STATUSES.filter((candidate) => candidate !== task.status)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label={`Actions for ${task.title}`}
          className="-mr-1 -mt-1 size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
        >
          <MoreVerticalIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem onSelect={handleEdit}>
          <PencilIcon />
          Edit task
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Move to</DropdownMenuLabel>
        {otherStatuses.map((candidate) => (
          <DropdownMenuItem
            key={candidate}
            onSelect={() => {
              onMove(task.id, candidate)
            }}
          >
            <span
              aria-hidden="true"
              className={`size-2 shrink-0 rounded-full ${STATUS_DOT_CLASSES[candidate]}`}
            />
            {STATUS_LABELS[candidate]}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleDelete}>
          <Trash2Icon />
          Delete task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
