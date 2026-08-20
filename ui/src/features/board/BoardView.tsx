import { useCallback, useMemo, useState } from 'react'
import { Alert } from '../../components/common/Alert'
import { Spinner } from '../../components/common/Spinner'
import { NavBar } from '../../components/layout/NavBar'
import { useAuth } from '../../hooks/useAuth'
import {
  TASK_STATUSES,
  type TaskQuery,
  type TaskResponse,
  type TaskStatus,
  type UserResponse,
} from '../../types/api'
import { BoardColumn } from './BoardColumn'
import { TaskFormModal } from './TaskFormModal'
import { useCategories } from './useCategories'
import { useTaskBoard } from './useTaskBoard'

interface BoardViewProps {
  readonly user: UserResponse
}

/** Null means the dialog is closed; a task edits it, `'new'` creates one. */
type DialogState = { readonly mode: 'closed' } | { readonly mode: 'new' } | {
  readonly mode: 'edit'
  readonly task: TaskResponse
}

const INITIAL_QUERY: TaskQuery = {
  status: null,
  priority: null,
  categoryId: null,
  sortBy: 'createdAt',
  sortDirection: 'desc',
}

/**
 * Container for the dashboard: owns the query, wires the nav bar to the data
 * hook, and renders the three status boards.
 */
export function BoardView({ user }: BoardViewProps) {
  const { logout } = useAuth()
  const [query, setQuery] = useState<TaskQuery>(INITIAL_QUERY)
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' })

  const { categories, hasFailed: categoriesFailed } = useCategories()
  const board = useTaskBoard(query)

  const handleNewTask = useCallback(() => {
    setDialog({ mode: 'new' })
  }, [])

  const handleEditTask = useCallback((task: TaskResponse) => {
    setDialog({ mode: 'edit', task })
  }, [])

  const handleCloseDialog = useCallback(() => {
    setDialog({ mode: 'closed' })
  }, [])

  const handleLogout = useCallback(() => {
    void logout()
  }, [logout])

  const handleMove = useCallback(
    (taskId: number, status: TaskStatus) => {
      // The hook surfaces the failure through `mutationError`; the rejection is
      // absorbed here so it never becomes an unhandled promise rejection.
      void board.moveTask(taskId, status).catch(() => undefined)
    },
    [board],
  )

  const handleDelete = useCallback(
    (task: TaskResponse) => {
      const confirmed = window.confirm(
        `Delete "${task.title}"? This also removes its subtasks and cannot be undone.`,
      )
      if (confirmed) {
        void board.deleteTask(task.id).catch(() => undefined)
      }
    },
    [board],
  )

  // The board only renders the columns matching an active status filter, so a
  // filtered view does not show two permanently empty boards.
  const visibleStatuses = useMemo<readonly TaskStatus[]>(
    () => (query.status === null ? TASK_STATUSES : [query.status]),
    [query.status],
  )

  const isInitialLoad = board.status === 'loading'
  const hasNoTasks = board.status === 'ready' && board.loadedCount === 0

  return (
    <div className="board-view">
      <NavBar
        username={user.username}
        query={query}
        categories={categories}
        categoriesUnavailable={categoriesFailed}
        isBusy={board.isRefreshing}
        onQueryChange={setQuery}
        onNewTask={handleNewTask}
        onLogout={handleLogout}
      />

      <main className="board-view__main">
        {board.mutationError !== null && (
          <Alert
            tone="error"
            message={board.mutationError}
            onDismiss={board.dismissMutationError}
          />
        )}

        {board.status === 'error' && board.error !== null && (
          <Alert tone="error" message={board.error} onRetry={board.refresh} />
        )}

        {isInitialLoad && (
          <div className="board-view__loading">
            <Spinner label="Loading your tasks" />
            <p>Loading your tasks…</p>
          </div>
        )}

        {hasNoTasks && (
          <div className="board-view__empty">
            <h2>No tasks yet</h2>
            <p>
              {query.categoryId !== null || query.priority !== null || query.status !== null
                ? 'No tasks match the current filters. Clear them to see everything.'
                : 'Create your first task to get moving.'}
            </p>
            <button type="button" className="btn btn--primary" onClick={handleNewTask}>
              New Task
            </button>
          </div>
        )}

        {board.status === 'ready' && board.loadedCount > 0 && (
          <>
            <div className="board-view__columns">
              {visibleStatuses.map((status) => (
                <BoardColumn
                  key={status}
                  status={status}
                  tasks={board.tasksByStatus[status]}
                  pendingTaskId={board.pendingTaskId}
                  onEdit={handleEditTask}
                  onMove={handleMove}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {board.hasMore && (
              <div className="board-view__more">
                <p>
                  Showing {board.loadedCount} of {board.totalElements} tasks.
                </p>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={board.loadMore}
                  disabled={board.isLoadingMore}
                >
                  {board.isLoadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {dialog.mode !== 'closed' && (
        <TaskFormModal
          task={dialog.mode === 'edit' ? dialog.task : null}
          categories={categories}
          onCreate={board.createTask}
          onUpdate={board.updateTask}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  )
}
