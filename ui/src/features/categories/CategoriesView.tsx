import { useCallback, useState, type FormEvent } from 'react'
import { Alert } from '../../components/common/Alert'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { Spinner } from '../../components/common/Spinner'
import { LIMITS, type CategoryResponse } from '../../types/api'
import { useCategoryManager } from './useCategoryManager'

interface CategoryRowProps {
  readonly category: CategoryResponse
  readonly isPending: boolean
  readonly onRename: (categoryId: number, name: string) => void
  readonly onRequestDelete: (category: CategoryResponse) => void
}

/**
 * Presentational row. Deletion is refused locally while the category still
 * holds tasks: `tasks.category_id` is a RESTRICT foreign key with no cascade,
 * so the API would fail with an unhandled database error rather than a
 * meaningful message.
 */
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
    <li className={isPending ? 'category-row category-row--pending' : 'category-row'}>
      {isEditing ? (
        <input
          className="field__input"
          type="text"
          value={draft}
          maxLength={LIMITS.categoryNameMax}
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
              setDraft(category.name)
              setIsEditing(false)
            }
          }}
        />
      ) : (
        <div className="category-row__label">
          <span className="category-row__name">{category.name}</span>
          <span className="meta">
            {category.taskCount} {category.taskCount === 1 ? 'task' : 'tasks'}
          </span>
        </div>
      )}

      <div className="category-row__actions">
        {isPending && <Spinner label="Updating category" size="sm" />}
        <button
          type="button"
          className="m-oauth m-sm"
          disabled={isPending || isEditing}
          onClick={() => {
            setIsEditing(true)
          }}
        >
          Rename
        </button>
        <button
          type="button"
          className="m-oauth m-sm m-danger"
          disabled={isPending || inUse}
          title={
            inUse
              ? 'Move or delete this category’s tasks before deleting it.'
              : undefined
          }
          onClick={() => {
            onRequestDelete(category)
          }}
        >
          Delete
        </button>
      </div>
    </li>
  )
}

/** Container for category CRUD. */
export function CategoriesView() {
  const manager = useCategoryManager()
  const [draft, setDraft] = useState('')
  const [pendingDelete, setPendingDelete] = useState<CategoryResponse | null>(null)

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
  const anyInUse = manager.categories.some((category) => category.taskCount > 0)

  return (
    <div className="panel-split">
      <section className="panel-split__aside">
        <h2 className="panel-split__title">Categories</h2>
        <p className="panel-split__lede display-accent">
          Group tasks by the kind of work they represent.
        </p>
        <p className="meta panel-split__note">
          A category can only be deleted once nothing references it. Move its tasks
          elsewhere first.
        </p>

        <form className="stack" onSubmit={handleCreate}>
          <label className="field">
            <span className="field__label">New category</span>
            <input
              className="field__input"
              type="text"
              value={draft}
              maxLength={LIMITS.categoryNameMax}
              placeholder="Design, Research, Admin…"
              disabled={manager.isCreating}
              onChange={(event) => {
                setDraft(event.target.value)
              }}
            />
          </label>
          <button
            type="submit"
            className="m-primary"
            disabled={manager.isCreating || draft.trim().length === 0}
          >
            {manager.isCreating && <Spinner label="Creating" size="sm" />}
            Create category
          </button>
        </form>
      </section>

      <section className="panel-split__main">
        {manager.mutationError !== null && (
          <Alert
            tone="error"
            message={manager.mutationError}
            onDismiss={manager.dismissMutationError}
          />
        )}

        {manager.status === 'loading' && (
          <p className="state-line">
            <Spinner label="Loading categories" size="sm" /> Loading categories…
          </p>
        )}

        {manager.status === 'error' && manager.error !== null && (
          <Alert tone="error" message={manager.error} onRetry={manager.reload} />
        )}

        {manager.status === 'ready' && !hasCategories && (
          <div className="zero-state">
            <h3>No categories yet</h3>
            <p className="display-accent">
              Create one on the left to start grouping your tasks.
            </p>
          </div>
        )}

        {manager.status === 'ready' && hasCategories && (
          <>
            <ul className="category-list">
              {manager.categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  isPending={manager.pendingId === category.id}
                  onRename={handleRename}
                  onRequestDelete={setPendingDelete}
                />
              ))}
            </ul>
            {anyInUse && (
              <p className="meta">
                Categories in use cannot be deleted while tasks still reference them.
              </p>
            )}
          </>
        )}
      </section>

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
