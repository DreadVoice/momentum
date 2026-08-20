import { useCallback, useId, useState, type FormEvent } from 'react'
import { Alert } from '../../components/common/Alert'
import { Modal } from '../../components/common/Modal'
import { Spinner } from '../../components/common/Spinner'
import { isApiError, toErrorMessage } from '../../lib/ApiError'
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TaskPriority,
  TaskStatus,
  type CategoryResponse,
  type TaskCreateRequest,
  type TaskResponse,
  type TaskUpdateRequest,
} from '../../types/api'
import { PRIORITY_LABELS, STATUS_LABELS } from './boardConfig'

const MAX_TITLE_LENGTH = 255
const MAX_DESCRIPTION_LENGTH = 1000

interface TaskFormModalProps {
  /** Null creates a task; a task edits it in place. */
  readonly task: TaskResponse | null
  readonly categories: readonly CategoryResponse[]
  readonly onCreate: (body: TaskCreateRequest) => Promise<void>
  readonly onUpdate: (taskId: number, body: TaskUpdateRequest) => Promise<void>
  readonly onClose: () => void
}

interface FormValues {
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  categoryId: string
  dueDate: string
}

function initialValues(
  task: TaskResponse | null,
  categories: readonly CategoryResponse[],
): FormValues {
  if (task === null) {
    return {
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      categoryId: '',
      dueDate: '',
    }
  }

  // TaskResponse carries `categoryName`, not the id, so the current category is
  // resolved back to an id through the loaded list.
  const matched = categories.find((category) => category.name === task.categoryName)

  return {
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    status: task.status,
    categoryId: matched === undefined ? '' : String(matched.id),
    dueDate: task.dueDate ?? '',
  }
}

/**
 * Create/edit dialog. Uses PUT for edits so that clearing the due date or the
 * category actually persists - PATCH ignores nulls on this API.
 */
export function TaskFormModal({
  task,
  categories,
  onCreate,
  onUpdate,
  onClose,
}: TaskFormModalProps) {
  const isEditing = task !== null
  const [values, setValues] = useState<FormValues>(() => initialValues(task, categories))
  const [titleError, setTitleError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fieldId = useId()

  const setText = useCallback((field: 'title' | 'description' | 'categoryId' | 'dueDate', value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
  }, [])

  // `<select>` hands back a plain string; narrowing it against the known enum
  // values keeps the union honest without a cast.
  const setPriority = useCallback((value: string) => {
    const parsed = TASK_PRIORITIES.find((candidate) => candidate === value)
    setValues((current) => ({ ...current, priority: parsed ?? current.priority }))
  }, [])

  const setStatus = useCallback((value: string) => {
    const parsed = TASK_STATUSES.find((candidate) => candidate === value)
    setValues((current) => ({ ...current, status: parsed ?? current.status }))
  }, [])

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const title = values.title.trim()

      if (title.length === 0) {
        setTitleError('A title is required.')
        return
      }
      if (title.length > MAX_TITLE_LENGTH) {
        setTitleError('Titles cannot exceed ' + String(MAX_TITLE_LENGTH) + ' characters.')
        return
      }

      setTitleError(null)
      setFormError(null)
      setIsSubmitting(true)

      const description = values.description.trim()
      const shared = {
        title,
        description: description.length > 0 ? description : null,
        priority: values.priority,
        categoryId: values.categoryId === '' ? null : Number(values.categoryId),
        dueDate: values.dueDate === '' ? null : values.dueDate,
      }

      const submission =
        task !== null
          ? onUpdate(task.id, { ...shared, status: values.status })
          : onCreate(shared)

      submission
        .then(() => {
          onClose()
        })
        .catch((error: unknown) => {
          const fieldMessage = isApiError(error) ? error.fieldErrors.title : undefined
          if (fieldMessage !== undefined) {
            setTitleError(fieldMessage)
          }
          setFormError(toErrorMessage(error))
          setIsSubmitting(false)
        })
    },
    [values, task, onCreate, onUpdate, onClose],
  )

  return (
    <Modal title={isEditing ? 'Edit task' : 'New task'} onClose={onClose}>
      <form className="task-form" onSubmit={handleSubmit} noValidate>
        {formError !== null && <Alert tone="error" message={formError} />}

        <div className="field">
          <label className="field__label" htmlFor={fieldId + '-title'}>
            Title
          </label>
          <input
            id={fieldId + '-title'}
            className={titleError !== null ? 'field__input field__input--invalid' : 'field__input'}
            type="text"
            value={values.title}
            maxLength={MAX_TITLE_LENGTH}
            disabled={isSubmitting}
            aria-invalid={titleError !== null}
            onChange={(event) => {
              setText('title', event.target.value)
            }}
          />
          {titleError !== null && <p className="field__error">{titleError}</p>}
        </div>

        <div className="field">
          <label className="field__label" htmlFor={fieldId + '-description'}>
            Description <span className="field__optional">optional</span>
          </label>
          <textarea
            id={fieldId + '-description'}
            className="field__input field__input--textarea"
            value={values.description}
            rows={3}
            maxLength={MAX_DESCRIPTION_LENGTH}
            disabled={isSubmitting}
            onChange={(event) => {
              setText('description', event.target.value)
            }}
          />
          <p className="field__hint">
            {values.description.length} / {MAX_DESCRIPTION_LENGTH}
          </p>
        </div>

        <div className="task-form__row">
          <div className="field">
            <label className="field__label" htmlFor={fieldId + '-priority'}>
              Priority
            </label>
            <select
              id={fieldId + '-priority'}
              className="field__input"
              value={values.priority}
              disabled={isSubmitting}
              onChange={(event) => {
                setPriority(event.target.value)
              }}
            >
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </div>

          {isEditing && (
            <div className="field">
              <label className="field__label" htmlFor={fieldId + '-status'}>
                Status
              </label>
              <select
                id={fieldId + '-status'}
                className="field__input"
                value={values.status}
                disabled={isSubmitting}
                onChange={(event) => {
                  setStatus(event.target.value)
                }}
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="task-form__row">
          <div className="field">
            <label className="field__label" htmlFor={fieldId + '-category'}>
              Category <span className="field__optional">optional</span>
            </label>
            <select
              id={fieldId + '-category'}
              className="field__input"
              value={values.categoryId}
              disabled={isSubmitting || categories.length === 0}
              onChange={(event) => {
                setText('categoryId', event.target.value)
              }}
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor={fieldId + '-due'}>
              Due date <span className="field__optional">optional</span>
            </label>
            <input
              id={fieldId + '-due'}
              className="field__input"
              type="date"
              value={values.dueDate}
              disabled={isSubmitting}
              onChange={(event) => {
                setText('dueDate', event.target.value)
              }}
            />
          </div>
        </div>

        {!isEditing && (
          <p className="task-form__note">New tasks always start in the Pending board.</p>
        )}

        <div className="task-form__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {isSubmitting && <Spinner label="Saving" size="sm" />}
            {isEditing ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
