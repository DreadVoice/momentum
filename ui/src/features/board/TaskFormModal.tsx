import { useCallback, useId, useState, type FormEvent } from 'react'
import { Alert } from '../../components/common/Alert'
import { Spinner } from '../../components/common/Spinner'
import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import { isApiError, toErrorMessage } from '../../lib/ApiError'
import { cn } from '../../lib/utils'
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

const NO_CATEGORY = '__none__'

interface TaskFormModalProps {
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
      categoryId: NO_CATEGORY,
      dueDate: '',
    }
  }

  const matched = categories.find((category) => category.name === task.categoryName)

  return {
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    status: task.status,
    categoryId: matched === undefined ? NO_CATEGORY : String(matched.id),
    dueDate: task.dueDate ?? '',
  }
}

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

  const setText = useCallback(
    (field: 'title' | 'description' | 'categoryId' | 'dueDate', value: string) => {
      setValues((current) => ({ ...current, [field]: value }))
    },
    [],
  )

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
        categoryId: values.categoryId === NO_CATEGORY ? null : Number(values.categoryId),
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
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit task' : 'New task'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the details of this task.'
              : 'New tasks always start in the Pending board.'}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          {formError !== null && <Alert tone="error" message={formError} />}

          <div className="flex flex-col gap-2">
            <Label htmlFor={`${fieldId}-title`}>Title</Label>
            <Input
              id={`${fieldId}-title`}
              type="text"
              value={values.title}
              maxLength={MAX_TITLE_LENGTH}
              disabled={isSubmitting}
              aria-invalid={titleError !== null}
              aria-describedby={titleError !== null ? `${fieldId}-title-error` : undefined}
              autoFocus
              onChange={(event) => {
                setText('title', event.target.value)
              }}
            />
            {titleError !== null && (
              <p id={`${fieldId}-title-error`} className="text-xs text-destructive">
                {titleError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`${fieldId}-description`}>
              Description
              <span className="text-xs font-normal text-muted-foreground">optional</span>
            </Label>
            <Textarea
              id={`${fieldId}-description`}
              value={values.description}
              rows={3}
              maxLength={MAX_DESCRIPTION_LENGTH}
              disabled={isSubmitting}
              className="max-h-52"
              onChange={(event) => {
                setText('description', event.target.value)
              }}
            />
            <p
              className={cn(
                'tabular self-end text-xs text-muted-foreground',
                values.description.length > MAX_DESCRIPTION_LENGTH * 0.9 && 'text-warning',
              )}
            >
              {values.description.length} / {MAX_DESCRIPTION_LENGTH}
            </p>
          </div>

          <div className={cn('grid gap-4', isEditing && 'sm:grid-cols-2')}>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${fieldId}-priority`}>Priority</Label>
              <Select
                value={values.priority}
                disabled={isSubmitting}
                onValueChange={setPriority}
              >
                <SelectTrigger id={`${fieldId}-priority`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {PRIORITY_LABELS[priority]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isEditing && (
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${fieldId}-status`}>Board</Label>
                <Select value={values.status} disabled={isSubmitting} onValueChange={setStatus}>
                  <SelectTrigger id={`${fieldId}-status`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${fieldId}-category`}>
                Category
                <span className="text-xs font-normal text-muted-foreground">optional</span>
              </Label>
              <Select
                value={values.categoryId}
                disabled={isSubmitting || categories.length === 0}
                onValueChange={(value) => {
                  setText('categoryId', value)
                }}
              >
                <SelectTrigger id={`${fieldId}-category`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`${fieldId}-due`}>
                Due date
                <span className="text-xs font-normal text-muted-foreground">optional</span>
              </Label>
              <Input
                id={`${fieldId}-due`}
                type="date"
                value={values.dueDate}
                disabled={isSubmitting}
                onChange={(event) => {
                  setText('dueDate', event.target.value)
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner label="Saving" size="sm" />}
              {isEditing ? 'Save changes' : 'Create task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
