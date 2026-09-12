import { PencilIcon, PlusIcon, TagsIcon, Trash2Icon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useId, useState, type FormEvent } from 'react'
import { Alert } from '../../components/common/Alert'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { Spinner } from '../../components/common/Spinner'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Skeleton } from '../../components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip'
import { cn } from '../../lib/utils'
import { LIMITS, type CategoryResponse } from '../../types/api'
import { useCategoryManager } from './useCategoryManager'

interface CategoryRowProps {
  readonly category: CategoryResponse
  readonly isPending: boolean
  readonly onRename: (categoryId: number, name: string) => void
  readonly onRequestDelete: (category: CategoryResponse) => void
}

function CategoryRow({ category, isPending, onRename, onRequestDelete }: CategoryRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(category.name)

  const inUse = category.taskCount > 0

  const commit = useCallback(() => {
    const trimmed = draft.trim()
    setIsEditing(false)

    if (trimmed.length > 0 && trimmed !== category.name) {
      onRename(category.id, trimmed)
    } else {
      setDraft(category.name)
    }
  }, [draft, category, onRename])

  return (
    <li
      className={cn(
        'group/row flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:border-foreground/20',
        isPending && 'opacity-55',
      )}
    >
      {isEditing ? (
        <Input
          type="text"
          value={draft}
          maxLength={LIMITS.categoryNameMax}
          autoFocus
          aria-label={`Rename ${category.name}`}
          className="h-8"
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
              setDraft(category.name)
              setIsEditing(false)
            }
          }}
        />
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="truncate text-sm font-medium">{category.name}</span>
          <span className="tabular shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {category.taskCount} {category.taskCount === 1 ? 'task' : 'tasks'}
          </span>
        </div>
      )}

      <div className="flex shrink-0 items-center gap-0.5">
        {isPending && (
          <Spinner label="Updating category" size="sm" className="text-muted-foreground" />
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isPending || isEditing}
          aria-label={`Rename ${category.name}`}
          className="text-muted-foreground opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100"
          onClick={() => {
            setIsEditing(true)
          }}
        >
          <PencilIcon className="size-3.5" />
        </Button>

        {inUse ? (
          <Tooltip>
            <TooltipTrigger asChild>
              {/* A disabled button emits no pointer events, so the tooltip needs a wrapper. */}
              <span className="inline-flex opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled
                  aria-label={`Delete ${category.name}`}
                  className="text-muted-foreground"
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Move or delete this category&rsquo;s tasks before deleting it.
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isPending}
            aria-label={`Delete ${category.name}`}
            className="text-muted-foreground opacity-0 group-hover/row:opacity-100 hover:text-destructive focus-visible:opacity-100"
            onClick={() => {
              onRequestDelete(category)
            }}
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        )}
      </div>
    </li>
  )
}

export function CategoriesView() {
  const manager = useCategoryManager()
  const [draft, setDraft] = useState('')
  const [pendingDelete, setPendingDelete] = useState<CategoryResponse | null>(null)
  const newCategoryId = useId()

  const handleCreate = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      manager
        .create(draft)
        .then(() => {
          setDraft('')
        })
        .catch(() => undefined)
    },
    [manager, draft],
  )

  const handleRename = useCallback(
    (categoryId: number, name: string) => {
      manager.rename(categoryId, name).catch(() => undefined)
    },
    [manager],
  )

  const handleConfirmDelete = useCallback(async (): Promise<void> => {
    if (pendingDelete !== null) {
      await manager.remove(pendingDelete.id)
    }
  }, [manager, pendingDelete])

  const closeConfirm = useCallback(() => {
    setPendingDelete(null)
  }, [])

  const hasCategories = manager.categories.length > 0

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Group tasks by the kind of work they represent.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">New category</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form className="flex flex-col gap-3" onSubmit={handleCreate}>
              <div className="flex flex-col gap-2">
                <Label htmlFor={newCategoryId} className="sr-only">
                  Category name
                </Label>
                <Input
                  id={newCategoryId}
                  type="text"
                  value={draft}
                  maxLength={LIMITS.categoryNameMax}
                  placeholder="Design, Research, Admin…"
                  disabled={manager.isCreating}
                  onChange={(event) => {
                    setDraft(event.target.value)
                  }}
                />
              </div>
              <Button
                type="submit"
                disabled={manager.isCreating || draft.trim().length === 0}
              >
                {manager.isCreating ? <Spinner label="Creating" size="sm" /> : <PlusIcon />}
                Create category
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          A category can only be deleted once nothing references it. Move its tasks elsewhere
          first.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {manager.mutationError !== null && (
          <Alert
            tone="error"
            message={manager.mutationError}
            onDismiss={manager.dismissMutationError}
          />
        )}

        {manager.status === 'loading' && (
          <div className="flex flex-col gap-2" aria-hidden="true">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        )}

        {manager.status === 'error' && manager.error !== null && (
          <Alert tone="error" message={manager.error} onRetry={manager.reload} />
        )}

        {manager.status === 'ready' && !hasCategories && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <TagsIcon className="size-5" aria-hidden="true" />
            </span>
            <h2 className="text-base">No categories yet</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Create one on the left to start grouping your tasks.
            </p>
          </div>
        )}

        {manager.status === 'ready' && hasCategories && (
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {manager.categories.map((category) => (
                <motion.div
                  key={category.id}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                >
                  <CategoryRow
                    category={category}
                    isPending={manager.pendingId === category.id}
                    onRename={handleRename}
                    onRequestDelete={setPendingDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {pendingDelete !== null && (
        <ConfirmDialog
          title="Delete category"
          body={`Delete "${pendingDelete.name}"? This cannot be undone.`}
          confirmLabel="Delete category"
          onConfirm={handleConfirmDelete}
          onClose={closeConfirm}
        />
      )}
    </div>
  )
}
