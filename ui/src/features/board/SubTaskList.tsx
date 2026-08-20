import { useCallback, useState, type FormEvent } from 'react'
import { Alert } from '../../components/common/Alert'
import { Spinner } from '../../components/common/Spinner'
import { LIMITS, type SubTaskResponse } from '../../types/api'
import { useSubTasks } from './useSubTasks'

interface SubTaskListProps {
  readonly taskId: number
  /** Lets the board refresh the parent task's subtask counters. */
  readonly onChanged: () => void
}

interface SubTaskRowProps {
  readonly subTask: SubTaskResponse
  readonly isPending: boolean
  readonly onToggle: (subTaskId: number) => void
  readonly onRename: (subTask: SubTaskResponse, title: string) => void
  readonly onRemove: (subTaskId: number) => void
}

/** Presentational row with an inline rename affordance. */
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
      <li className="subtask">
        <input
          className="field__input"
          type="text"
          value={draft}
          maxLength={LIMITS.subTaskTitleMax}
          autoFocus
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
    <li className={isPending ? 'subtask subtask--pending' : 'subtask'}>
      <label className="subtask__check">
        <input
          type="checkbox"
          checked={subTask.completed}
          disabled={isPending}
          onChange={() => {
            onToggle(subTask.id)
          }}
        />
        <span className={subTask.completed ? 'subtask__title subtask__title--done' : 'subtask__title'}>
          {subTask.title}
        </span>
      </label>

      <div className="subtask__actions">
        {isPending && <Spinner label="Updating subtask" size="sm" />}
        <button
          type="button"
          className="icon-btn"
          disabled={isPending}
          aria-label={`Rename ${subTask.title}`}
          onClick={() => {
            setIsEditing(true)
          }}
        >
          &#9998;
        </button>
        <button
          type="button"
          className="icon-btn"
          disabled={isPending}
          aria-label={`Delete ${subTask.title}`}
          onClick={() => {
            onRemove(subTask.id)
          }}
        >
          &#10005;
        </button>
      </div>
    </li>
  )
}

/**
 * Container for one task's subtasks. Every mutation notifies the parent so the
 * board's `subTaskCount` / `completedSubTaskCount` badges stay truthful.
 */
export function SubTaskList({ taskId, onChanged }: SubTaskListProps) {
  const subTasks = useSubTasks(taskId)
  const [draft, setDraft] = useState('')

  const completed = subTasks.subTasks.filter((subTask) => subTask.completed).length

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
      subTasks
        .toggle(subTaskId)
        .then(onChanged)
        .catch(() => undefined)
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
      subTasks
        .remove(subTaskId)
        .then(onChanged)
        .catch(() => undefined)
    },
    [subTasks, onChanged],
  )

  return (
    <section className="subtasks">
      <header className="subtasks__header">
        <h3 className="micro">Subtasks</h3>
        {subTasks.status === 'ready' && subTasks.subTasks.length > 0 && (
          <span className="meta">
            {completed}/{subTasks.subTasks.length} done
          </span>
        )}
      </header>

      {subTasks.error !== null && (
        <Alert tone="error" message={subTasks.error} onDismiss={subTasks.dismissError} />
      )}

      {subTasks.status === 'loading' && (
        <p className="subtasks__state">
          <Spinner label="Loading subtasks" size="sm" /> Loading subtasks…
        </p>
      )}

      {subTasks.status === 'error' && (
        <button type="button" className="m-oauth m-sm" onClick={subTasks.reload}>
          Retry
        </button>
      )}

      {subTasks.status === 'ready' && (
        <>
          {subTasks.subTasks.length === 0 ? (
            <p className="subtasks__state">No subtasks yet.</p>
          ) : (
            <ul className="subtasks__list">
              {subTasks.subTasks.map((subTask) => (
                <SubTaskRow
                  key={subTask.id}
                  subTask={subTask}
                  isPending={subTasks.pendingId === subTask.id}
                  onToggle={handleToggle}
                  onRename={handleRename}
                  onRemove={handleRemove}
                />
              ))}
            </ul>
          )}

          <form className="subtasks__add" onSubmit={handleAdd}>
            <input
              className="field__input"
              type="text"
              value={draft}
              placeholder="Add a subtask"
              maxLength={LIMITS.subTaskTitleMax}
              disabled={subTasks.isCreating}
              onChange={(event) => {
                setDraft(event.target.value)
              }}
            />
            <button
              type="submit"
              className="m-oauth m-sm"
              disabled={subTasks.isCreating || draft.trim().length === 0}
            >
              {subTasks.isCreating && <Spinner label="Adding" size="sm" />}
              Add
            </button>
          </form>
          <p className="field__hint">Up to {LIMITS.subTaskTitleMax} characters.</p>
        </>
      )}
    </section>
  )
}
