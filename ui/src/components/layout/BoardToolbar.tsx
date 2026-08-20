import { useCallback } from 'react'
import { Spinner } from '../common/Spinner'
import { PRIORITY_LABELS, SORT_LABELS, STATUS_LABELS } from '../../features/board/boardConfig'
import {
  SORTABLE_TASK_PROPERTIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type CategoryResponse,
  type SortDirection,
  type SortableTaskProperty,
  type TaskPriority,
  type TaskQuery,
  type TaskStatus,
} from '../../types/api'

interface BoardToolbarProps {
  readonly query: TaskQuery
  readonly categories: readonly CategoryResponse[]
  readonly categoriesUnavailable: boolean
  readonly isBusy: boolean
  readonly onQueryChange: (next: TaskQuery) => void
  readonly onNewTask: () => void
}


export function BoardToolbar({
  query,
  categories,
  categoriesUnavailable,
  isBusy,
  onQueryChange,
  onNewTask,
}: BoardToolbarProps) {
  const handleCategoryChange = useCallback(
    (value: string) => {
      onQueryChange({ ...query, categoryId: value === '' ? null : Number(value) })
    },
    [query, onQueryChange],
  )

  const handleStatusChange = useCallback(
    (value: string) => {
      const parsed: TaskStatus | undefined = TASK_STATUSES.find(
        (candidate) => candidate === value,
      )
      onQueryChange({ ...query, status: parsed ?? null })
    },
    [query, onQueryChange],
  )

  const handlePriorityChange = useCallback(
    (value: string) => {
      const parsed: TaskPriority | undefined = TASK_PRIORITIES.find(
        (candidate) => candidate === value,
      )
      onQueryChange({ ...query, priority: parsed ?? null })
    },
    [query, onQueryChange],
  )

  const handleSortChange = useCallback(
    (value: string) => {
      const parsed: SortableTaskProperty | undefined = SORTABLE_TASK_PROPERTIES.find(
        (candidate) => candidate === value,
      )
      onQueryChange({ ...query, sortBy: parsed ?? query.sortBy })
    },
    [query, onQueryChange],
  )

  const handleDirectionToggle = useCallback(() => {
    const next: SortDirection = query.sortDirection === 'asc' ? 'desc' : 'asc'
    onQueryChange({ ...query, sortDirection: next })
  }, [query, onQueryChange])

  return (
    <div className="toolbar">
      <div className="toolbar__filters" role="group" aria-label="Filter and sort tasks">
        <label className="field toolbar__field">
          <span className="field__label">Category</span>
          <select
            className="field__input"
            value={query.categoryId === null ? '' : String(query.categoryId)}
            disabled={categoriesUnavailable || categories.length === 0}
            onChange={(event) => {
              handleCategoryChange(event.target.value)
            }}
          >
            <option value="">{categoriesUnavailable ? 'Unavailable' : 'All'}</option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field toolbar__field">
          <span className="field__label">Board</span>
          <select
            className="field__input"
            value={query.status ?? ''}
            onChange={(event) => {
              handleStatusChange(event.target.value)
            }}
          >
            <option value="">All</option>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="field toolbar__field">
          <span className="field__label">Priority</span>
          <select
            className="field__input"
            value={query.priority ?? ''}
            onChange={(event) => {
              handlePriorityChange(event.target.value)
            }}
          >
            <option value="">Any</option>
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </label>

        <label className="field toolbar__field">
          <span className="field__label">Sort</span>
          <select
            className="field__input"
            value={query.sortBy}
            onChange={(event) => {
              handleSortChange(event.target.value)
            }}
          >
            {SORTABLE_TASK_PROPERTIES.map((property) => (
              <option key={property} value={property}>
                {SORT_LABELS[property]}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="m-oauth m-sm toolbar__direction"
          onClick={handleDirectionToggle}
          aria-label={
            query.sortDirection === 'asc'
              ? 'Sorted ascending. Switch to descending.'
              : 'Sorted descending. Switch to ascending.'
          }
        >
          {query.sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
        </button>
      </div>

      <div className="toolbar__actions">
        {isBusy && <Spinner label="Loading tasks" size="sm" />}
        <button type="button" className="m-primary" onClick={onNewTask}>
          New Task
        </button>
      </div>
    </div>
  )
}
