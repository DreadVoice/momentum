import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState, type FormEvent } from 'react'
import { Alert } from '../../components/common/Alert'
import { Spinner } from '../../components/common/Spinner'
import { Button } from '../../components/ui/button'
import { Checkbox } from '../../components/ui/checkbox'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'
import { cn } from '../../lib/utils'
import { LIMITS, type SubTaskResponse } from '../../types/api'
import { useSubTasks } from './useSubTasks'

interface SubTaskListProps {
  readonly taskId: number
  readonly onChanged: () => void
}

interface SubTaskRowProps {
  readonly subTask: SubTaskResponse
  readonly isPending: boolean
  readonly onToggle: (subTaskId: number) => void
  readonly onRename: (subTask: SubTaskResponse, title: string) => void
  readonly onRemove: (subTaskId: number) => void
}

function SubTaskRow({ subTask, isPending, onToggle, onRename, onRemove }: SubTaskRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(subTask.title)

  const commit = useCallback(() => {
    const trimmed = draft.trim()
    setIsEditing(false)

    if (trimmed.length > 0 && trimmed !== subTask.title) {
      onRename(subTask, trimmed)
    } else {
      setDraft(subTask.title)
    }
  }, [draft, subTask, onRename])

  const cancel = useCallback(() => {
    setDraft(subTask.title)
    setIsEditing(false)
  }, [subTask.title])

  if (isEditing) {
    return (
      <li>
        <Input
          type="text"
          value={draft}
          maxLength={LIMITS.subTaskTitleMax}
          autoFocus
          aria-label={`Rename ${subTask.title}`}
          className="h-8 text-sm"
          onChange={(event) => {
            setDraft(event.target.value)
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commit()
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              cancel()
            }
          }}
        />
      </li>
    )
  }

  return (
    <li
      className={cn(
        'group/subtask flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-muted/60',
        isPending && 'opacity-55',
      )}
    >
      <Checkbox
        id={`subtask-${subTask.id}`}
        checked={subTask.completed}
        disabled={isPending}
        onCheckedChange={() => {
          onToggle(subTask.id)
        }}
      />
      <label
        htmlFor={`subtask-${subTask.id}`}
        className={cn(
          'min-w-0 flex-1 cursor-pointer text-sm wrap-anywhere select-none',
          subTask.completed && 'text-muted-foreground line-through decoration-muted-foreground/40',
        )}
      >
        {subTask.title}
      </label>

      <div className="flex shrink-0 items-center gap-0.5">
        {isPending && <Spinner label="Updating subtask" size="sm" className="text-muted-foreground" />}
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isPending}
          aria-label={`Rename ${subTask.title}`}
          className="size-7 text-muted-foreground opacity-0 group-hover/subtask:opacity-100 focus-visible:opacity-100"
          onClick={() => {
            setIsEditing(true)
          }}
        >
          <PencilIcon className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isPending}
          aria-label={`Delete ${subTask.title}`}
          className="size-7 text-muted-foreground opacity-0 group-hover/subtask:opacity-100 hover:text-destructive focus-visible:opacity-100"
          onClick={() => {
            onRemove(subTask.id)
          }}
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      </div>
    </li>
  )
}

export function SubTaskList({ taskId, onChanged }: SubTaskListProps) {
  const subTasks = useSubTasks(taskId)
  const [draft, setDraft] = useState('')

  const total = subTasks.subTasks.length
  const completed = subTasks.subTasks.filter((subTask) => subTask.completed).length
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100)

  const handleAdd = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const title = draft.trim()
      if (title.length === 0) {
        return
      }

      subTasks
        .add(title)
        .then(() => {
          setDraft('')
          onChanged()
        })
        .catch(() => undefined)
    },
    [draft, subTasks, onChanged],
  )

  const handleToggle = useCallback(
    (subTaskId: number) => {
      subTasks.toggle(subTaskId).then(onChanged).catch(() => undefined)
    },
    [subTasks, onChanged],
  )

  const handleRename = useCallback(
    (subTask: SubTaskResponse, title: string) => {
      subTasks.rename(subTask, title).catch(() => undefined)
    },
    [subTasks],
  )

  const handleRemove = useCallback(
    (subTaskId: number) => {
      subTasks.remove(subTaskId).then(onChanged).catch(() => undefined)
    },
    [subTasks, onChanged],
  )

  return (
    <section className="flex flex-col gap-2.5">
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">Subtasks</h3>
        {subTasks.status === 'ready' && total > 0 && (
          <span className="tabular text-xs text-muted-foreground">
            {completed}/{total} done
          </span>
        )}
      </header>

      {subTasks.status === 'ready' && total > 0 && (
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress}% of subtasks complete`}
          className="h-1 w-full overflow-hidden rounded-full bg-muted"
        >
          <motion.div
            className="h-full rounded-full bg-success"
            initial={false}
            animate={{ width: `${String(progress)}%` }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      )}

      {subTasks.error !== null && (
        <Alert tone="error" message={subTasks.error} onDismiss={subTasks.dismissError} />
      )}

      {subTasks.status === 'loading' && (
        <div className="flex flex-col gap-1.5" aria-hidden="true">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
        </div>
      )}

      {subTasks.status === 'error' && (
        <Button type="button" variant="outline" size="sm" onClick={subTasks.reload}>
          Retry
        </Button>
      )}

      {subTasks.status === 'ready' && (
        <>
          {total === 0 ? (
            <p className="text-xs text-muted-foreground">No subtasks yet.</p>
          ) : (
            <ul className="-mx-1.5 flex flex-col">
              <AnimatePresence initial={false}>
                {subTasks.subTasks.map((subTask) => (
                  <motion.div
                    key={subTask.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <SubTaskRow
                      subTask={subTask}
                      isPending={subTasks.pendingId === subTask.id}
                      onToggle={handleToggle}
                      onRename={handleRename}
                      onRemove={handleRemove}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </ul>
          )}

          <form className="flex items-center gap-1.5" onSubmit={handleAdd}>
            <Input
              type="text"
              value={draft}
              placeholder="Add a subtask"
              maxLength={LIMITS.subTaskTitleMax}
              disabled={subTasks.isCreating}
              aria-label="New subtask title"
              className="h-8 text-sm"
              onChange={(event) => {
                setDraft(event.target.value)
              }}
            />
            <Button
              type="submit"
              variant="outline"
              size="icon-sm"
              disabled={subTasks.isCreating || draft.trim().length === 0}
              aria-label="Add subtask"
            >
              {subTasks.isCreating ? <Spinner label="Adding" size="sm" /> : <PlusIcon />}
            </Button>
          </form>
        </>
      )}
    </section>
  )
}
