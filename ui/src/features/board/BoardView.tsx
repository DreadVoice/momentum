import { useCallback, useMemo, useState } from 'react'
import { Alert } from '../../components/common/Alert'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { Spinner } from '../../components/common/Spinner'
import { BoardToolbar } from '../../components/layout/BoardToolbar'
import {
  TASK_STATUSES,
  type TaskQuery,
  type TaskResponse,
  type TaskStatus,
} from '../../types/api'
import { BoardColumn } from './BoardColumn'
import { StatsStrip } from './StatsStrip'
import { TaskDetailPanel } from './TaskDetailPanel'
import { TaskFormModal } from './TaskFormModal'
import { useCategories } from './useCategories'
import { useTaskBoard } from './useTaskBoard'
import { useTaskStats } from './useTaskStats'

/** Closed, creating, or editing a specific task. */
type DialogState =
  | { readonly mode: 'closed' }
  | { readonly mode: 'new' }
  | { readonly mode: 'edit'; readonly task: TaskResponse }

const INITIAL_QUERY: TaskQuery = {
  status: null,
  priority: null,
  categoryId: null,
  sortBy: 'createdAt',
  sortDirection: 'desc',
}

/**
 * Container for the board: owns the query, the selection and the dialogs, and
 * wires the toolbar and the detail panel to the data hooks.
 */
export function BoardView() {
  const [query, setQuery] = useState<TaskQuery>(INITIAL_QUERY)
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' })
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<TaskResponse | null>(null)
  // Bumped after any mutation so the account-wide counters re-read.
  const [statsRevision, setStatsRevision] = useState(0)

  const { categories, hasFailed: categoriesFailed } = useCategories()
  const board = useTaskBoard(query)
  const { summary } = useTaskStats(statsRevision)

  const bumpStats = useCallback(() => {
    setStatsRevision((revision) => revision + 1)
  }, [])

  const handleNewTask = useCallback(() => {
    setDialog({ mode: 'new' })
  }, [])

  const handleEditTask = useCallback((task: TaskResponse) => {
    setDialog({ mode: 'edit', task })
  }, [])

  const handleCloseDialog = useCallback(() => {
    setDialog({ mode: 'closed' })
  }, [])

  const handleSelect = useCallback((task: TaskResponse) => {
    setSelectedTaskId((current) => (current === task.id ? null : task.id))
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedTaskId(null)
  }, [])

  const handleMove = useCallback(
    (taskId: number, status: TaskStatus) => {
      // Failures surface through `mutationError`; absorbing the rejection here
      // keeps it from becoming an unhandled promise rejection.
      board
        .moveTask(taskId, status)
        .then(bumpStats)
        .catch(() => undefined)
    },
    [board, bumpStats],
  )

  const handleCreate = useCallback(
    async (body: Parameters<typeof board.createTask>[0]): Promise<void> => {
      await board.createTask(body)
      bumpStats()
    },
    [board, bumpStats],
  )

  const handleUpdate = useCallback(
    async (taskId: number, body: Parameters<typeof board.updateTask>[1]): Promise<void> => {
      await board.updateTask(taskId, body)
      bumpStats()
    },
    [board, bumpStats],
  )

  const handleConfirmDelete = useCallback(async (): Promise<void> => {
    if (pendingDelete === null) {
      return
    }

    await board.deleteTask(pendingDelete.id)
    setSelectedTaskId((current) => (current === pendingDelete.id ? null : current))
    bumpStats()
  }, [board, pendingDelete, bumpStats])

  const handleSubTasksChanged = useCallback(() => {
    if (selectedTaskId !== null) {
      board.reloadTask(selectedTaskId)
    }
  }, [board, selectedTaskId])

  // Derived from the live list rather than stored, so the panel reflects the
  // latest server response after any mutation.
  const selectedTask = useMemo<TaskResponse | null>(() => {
    if (selectedTaskId === null) {
      return null
    }

    for (const status of TASK_STATUSES) {
      const found = board.tasksByStatus[status].find((task) => task.id === selectedTaskId)
      if (found !== undefined) {
        return found
      }
    }

    return null
  }, [selectedTaskId, board.tasksByStatus])

  // A status filter collapses the layout to the single matching column instead
  // of showing two permanently empty boards.
  const visibleStatuses = useMemo<readonly TaskStatus[]>(
    () => (query.status === null ? TASK_STATUSES : [query.status]),
    [query.status],
  )

  const isFiltered =
    query.status !== null || query.priority !== null || query.categoryId !== null
  const isInitialLoad = board.status === 'loading'
  const hasNoTasks = board.status === 'ready' && board.loadedCount === 0

  return (
    <div className="board">
      <BoardToolbar
        query={query}
        categories={categories}
        categoriesUnavailable={categoriesFailed}
        isBusy={board.isRefreshing}
        onQueryChange={setQuery}
        onNewTask={handleNewTask}
      />

      {summary !== null && <StatsStrip summary={summary} />}

      <div className="board__content">
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
          <p className="state-line">
            <Spinner label="Loading your tasks" size="sm" /> Loading your tasks…
          </p>
        )}

        {hasNoTasks && (
          <div className="zero-state">
            <h3>{isFiltered ? 'Nothing matches' : 'No tasks yet'}</h3>
            <p className="display-accent">
              {isFiltered
                ? 'No tasks match the current filters. Clear them to see everything.'
                : 'Create your first task to get moving.'}
            </p>
            <button type="button" className="m-primary" onClick={handleNewTask}>
              New Task
            </button>
          </div>
        )}

        {board.status === 'ready' && board.loadedCount > 0 && (
          <div className={selectedTask !== null ? 'board__split board__split--open' : 'board__split'}>
            <div className="board__columns">
              {visibleStatuses.map((status) => (
                <BoardColumn
                  key={status}
                  status={status}
                  tasks={board.tasksByStatus[status]}
                  pendingTaskId={board.pendingTaskId}
                  selectedTaskId={selectedTaskId}
                  onSelect={handleSelect}
                  onEdit={handleEditTask}
                  onMove={handleMove}
                  onDelete={setPendingDelete}
                />
              ))}

              {board.hasMore && (
                <div className="board__more">
                  <p className="meta">
                    Showing {board.loadedCount} of {board.totalElements}
                  </p>
                  <button
                    type="button"
                    className="m-oauth m-sm"
                    onClick={board.loadMore}
                    disabled={board.isLoadingMore}
                  >
                    {board.isLoadingMore ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </div>

            {selectedTask !== null && (
              <TaskDetailPanel
                task={selectedTask}
                isPending={board.pendingTaskId === selectedTask.id}
                onEdit={handleEditTask}
                onMove={handleMove}
                onDelete={setPendingDelete}
                onSubTasksChanged={handleSubTasksChanged}
                onClose={handleCloseDetail}
              />
            )}
          </div>
        )}
      </div>

      {dialog.mode !== 'closed' && (
        <TaskFormModal
          task={dialog.mode === 'edit' ? dialog.task : null}
          categories={categories}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onClose={handleCloseDialog}
        />
      )}

      {pendingDelete !== null && (
        <ConfirmDialog
          title="Delete task"
          body={`Delete "${pendingDelete.title}"? Its subtasks are removed with it. This cannot be undone.`}
          confirmLabel="Delete task"
          onConfirm={handleConfirmDelete}
          onClose={() => {
            setPendingDelete(null)
          }}
        />
      )}
    </div>
  )
}
