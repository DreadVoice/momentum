import { useCallback, useState } from 'react'
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

interface NavBarProps {
  readonly username: string
  readonly query: TaskQuery
  readonly categories: readonly CategoryResponse[]
  readonly categoriesUnavailable: boolean
  readonly isBusy: boolean
  readonly onQueryChange: (next: TaskQuery) => void
  readonly onNewTask: () => void
  readonly onLogout: () => void
}

/**
 * Presentational control bar: sorting, category and priority filtering, the
 * New Task entry point and the session menu. All query state is owned above.
 */
export function NavBar({
  username,
  query,
  categories,
  categoriesUnavailable,
  isBusy,
  onQueryChange,
  onNewTask,
  onLogout,
}: NavBarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

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
      // Guarded against the server-side whitelist in TaskController; an
      // unrecognised value would come back as a 400.
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

  const handleLogout = useCallback(() => {
    setIsLoggingOut(true)
    onLogout()
  }, [onLogout])

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <span className="navbar__logo" aria-hidden="true">
          M
        </span>
        <div>
          <p className="navbar__title">Momentum</p>
          <p className="navbar__user">Signed in as {username}</p>
        </div>
      </div>

      <div className="navbar__controls" role="group" aria-label="Filter and sort tasks">
        <label className="navbar__control">
          <span className="navbar__control-label">Category</span>
          <select
            className="navbar__select"
            value={query.categoryId === null ? '' : String(query.categoryId)}
            disabled={categoriesUnavailable || categories.length === 0}
            onChange={(event) => {
              handleCategoryChange(event.target.value)
            }}
          >
            <option value="">
              {categoriesUnavailable ? 'Unavailable' : 'All categories'}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name} ({category.taskCount})
              </option>
            ))}
          </select>
        </label>

        <label className="navbar__control">
          <span className="navbar__control-label">Board</span>
          <select
            className="navbar__select"
            value={query.status ?? ''}
            onChange={(event) => {
              handleStatusChange(event.target.value)
            }}
          >
            <option value="">All boards</option>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="navbar__control">
          <span className="navbar__control-label">Priority</span>
          <select
            className="navbar__select"
            value={query.priority ?? ''}
            onChange={(event) => {
              handlePriorityChange(event.target.value)
            }}
          >
            <option value="">Any priority</option>
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </label>

        <label className="navbar__control">
          <span className="navbar__control-label">Sort by</span>
          <select
            className="navbar__select"
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
          className="btn btn--ghost btn--sm"
          onClick={handleDirectionToggle}
          aria-label={
            query.sortDirection === 'asc'
              ? 'Sorted ascending. Switch to descending.'
              : 'Sorted descending. Switch to ascending.'
          }
        >
          {query.sortDirection === 'asc' ? 'Asc' : 'Desc'}
        </button>
      </div>

      <div className="navbar__actions">
        {isBusy && <Spinner label="Loading tasks" size="sm" />}
        <button type="button" className="btn btn--primary" onClick={onNewTask}>
          New Task
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Signing out' : 'Sign out'}
        </button>
      </div>
    </header>
  )
}
