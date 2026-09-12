import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { boardCollisionDetection } from './boardCollision'
import { boardKeyboardCoordinates } from './boardKeyboardCoordinates'
import { ClipboardListIcon, PlusIcon, SearchXIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Alert } from '../../components/common/Alert'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { BoardToolbar } from '../../components/layout/BoardToolbar'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import {
  TASK_STATUSES,
  type TaskQuery,
  type TaskResponse,
  type TaskStatus,
} from '../../types/api'
import { BoardColumn } from './BoardColumn'
import { BoardSkeleton } from './BoardSkeleton'
import { STATUS_LABELS } from './boardConfig'
import { StatsStrip } from './StatsStrip'
import { TaskCardBody } from './TaskCard'
import { TaskDetailPanel } from './TaskDetailPanel'
import { TaskFormModal } from './TaskFormModal'
import { useCategories } from './useCategories'
import { useTaskBoard } from './useTaskBoard'
import { useTaskStats } from './useTaskStats'

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

function isTaskStatus(value: unknown): value is TaskStatus {
  return TASK_STATUSES.some((candidate) => candidate === value)
}

export function BoardView() {
  const [query, setQuery] = useState<TaskQuery>(INITIAL_QUERY)
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' })
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<TaskResponse | null>(null)
  const [statsRevision, setStatsRevision] = useState(0)
  const [draggingTask, setDraggingTask] = useState<TaskResponse | null>(null)

  const { categories, hasFailed: categoriesFailed } = useCategories()
  const board = useTaskBoard(query)
  const { summary } = useTaskStats(statsRevision)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: boardKeyboardCoordinates }),
  )

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
      board
        .moveTask(taskId, status)
        .then(bumpStats)
        .catch(() => undefined)
    },
    [board, bumpStats],
  )

  const findTask = useCallback(
    (taskId: number): TaskResponse | null => {
      for (const status of TASK_STATUSES) {
        const found = board.tasksByStatus[status].find((task) => task.id === taskId)
        if (found !== undefined) {
          return found
        }
      }
      return null
    },
    [board.tasksByStatus],
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setDraggingTask(findTask(Number(event.active.id)))
    },
    [findTask],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggingTask(null)

      const { active, over } = event
      if (over === null) {
        return
      }

      const nextStatus = over.id
      const currentStatus = active.data.current?.status

      if (!isTaskStatus(nextStatus) || nextStatus === currentStatus) {
        return
      }

      handleMove(Number(active.id), nextStatus)
    },
    [handleMove],
  )

  const handleDragCancel = useCallback(() => {
    setDraggingTask(null)
  }, [])

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

  const selectedTask = useMemo<TaskResponse | null>(
    () => (selectedTaskId === null ? null : findTask(selectedTaskId)),
    [selectedTaskId, findTask],
  )

  const visibleStatuses = useMemo<readonly TaskStatus[]>(
    () => (query.status === null ? TASK_STATUSES : [query.status]),
    [query.status],
  )

  const announcements = useMemo<Announcements>(
    () => ({
      onDragStart: ({ active }) =>
        `Picked up task ${String(active.data.current?.title ?? active.id)}.`,
      onDragOver: ({ active, over }) =>
        over === null || !isTaskStatus(over.id)
          ? undefined
          : `Task ${String(active.data.current?.title ?? active.id)} is over ${STATUS_LABELS[over.id]}.`,
      onDragEnd: ({ active, over }) =>
        over === null || !isTaskStatus(over.id)
          ? `Task ${String(active.data.current?.title ?? active.id)} was dropped outside a board.`
          : `Task ${String(active.data.current?.title ?? active.id)} moved to ${STATUS_LABELS[over.id]}.`,
      onDragCancel: ({ active }) =>
        `Move of task ${String(active.data.current?.title ?? active.id)} was cancelled.`,
    }),
    [],
  )

  const isFiltered =
    query.status !== null || query.priority !== null || query.categoryId !== null
  const isInitialLoad = board.status === 'loading'
  const hasNoTasks = board.status === 'ready' && board.loadedCount === 0
  const isDetailOpen = selectedTask !== null

  return (
    <div className="flex flex-col">
      <BoardToolbar
        query={query}
        categories={categories}
        categoriesUnavailable={categoriesFailed}
        isBusy={board.isRefreshing}
        onQueryChange={setQuery}
        onNewTask={handleNewTask}
      />

      {summary !== null && <StatsStrip summary={summary} />}

      <div className="flex flex-col gap-4 px-4 py-5 sm:px-6">
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

        {isInitialLoad && <BoardSkeleton />}

        {hasNoTasks && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {isFiltered ? (
                <SearchXIcon className="size-5" aria-hidden="true" />
              ) : (
                <ClipboardListIcon className="size-5" aria-hidden="true" />
              )}
            </span>
            <h3 className="text-base">{isFiltered ? 'Nothing matches' : 'No tasks yet'}</h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              {isFiltered
                ? 'No tasks match the current filters. Clear them to see everything.'
                : 'Create your first task to get moving.'}
            </p>
            {!isFiltered && (
              <Button type="button" className="mt-1" onClick={handleNewTask}>
                <PlusIcon />
                New task
              </Button>
            )}
          </div>
        )}

        {board.status === 'ready' && board.loadedCount > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={boardCollisionDetection}
            accessibility={{ announcements }}
            modifiers={[restrictToWindowEdges]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div
              className={cn(
                'grid items-start gap-4',
                isDetailOpen ? 'xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]' : 'grid-cols-1',
              )}
            >
              <div className="flex flex-col gap-4">
                <div
                  className={cn(
                    'grid items-start gap-4',
                    visibleStatuses.length === 1
                      ? 'grid-cols-1 md:max-w-md'
                      : isDetailOpen
                        ? 'grid-cols-1 md:grid-cols-3'
                        : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
                  )}
                >
                  {visibleStatuses.map((status) => (
                    <BoardColumn
                      key={status}
                      status={status}
                      tasks={board.tasksByStatus[status]}
                      pendingTaskId={board.pendingTaskId}
                      selectedTaskId={selectedTaskId}
                      isDragActive={draggingTask !== null}
                      onSelect={handleSelect}
                      onEdit={handleEditTask}
                      onMove={handleMove}
                      onDelete={setPendingDelete}
                    />
                  ))}
                </div>

                {board.hasMore && (
                  <div className="flex items-center justify-between gap-3 border-t pt-3">
                    <p className="tabular text-xs text-muted-foreground">
                      Showing {board.loadedCount} of {board.totalElements}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={board.loadMore}
                      disabled={board.isLoadingMore}
                    >
                      {board.isLoadingMore ? 'Loading…' : 'Load more'}
                    </Button>
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

            <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2,0,0,1)' }}>
              {draggingTask !== null && (
                <TaskCardBody
                  task={draggingTask}
                  isPending={false}
                  isSelected={false}
                  isOverlay
                  onSelect={() => undefined}
                  onEdit={() => undefined}
                  onMove={() => undefined}
                  onDelete={() => undefined}
                />
              )}
            </DragOverlay>
          </DndContext>
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
