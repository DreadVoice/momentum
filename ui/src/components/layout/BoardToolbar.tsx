import { ArrowDownNarrowWideIcon, ArrowUpNarrowWideIcon, PlusIcon, XIcon } from 'lucide-react'
import { useCallback, useId } from 'react'
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
import { Spinner } from '../common/Spinner'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

const ANY = '__any__'

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
  const ids = useId()

  const handleCategoryChange = useCallback(
    (value: string) => {
      onQueryChange({ ...query, categoryId: value === ANY ? null : Number(value) })
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

  const handleClearFilters = useCallback(() => {
    onQueryChange({ ...query, status: null, priority: null, categoryId: null })
  }, [query, onQueryChange])

  const isFiltered =
    query.status !== null || query.priority !== null || query.categoryId !== null
  const isAscending = query.sortDirection === 'asc'

  return (
    <div className="flex flex-col gap-3 border-b bg-background/60 px-4 py-3 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
      <div
        role="group"
        aria-label="Filter and sort tasks"
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:flex lg:flex-wrap lg:items-end"
      >
        <div className="flex min-w-0 flex-col gap-1.5 lg:w-40">
          <Label htmlFor={`${ids}-category`} className="text-xs text-muted-foreground">
            Category
          </Label>
          <Select
            value={query.categoryId === null ? ANY : String(query.categoryId)}
            disabled={categoriesUnavailable || categories.length === 0}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger id={`${ids}-category`} size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>
                {categoriesUnavailable ? 'Unavailable' : 'All categories'}
              </SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5 lg:w-36">
          <Label htmlFor={`${ids}-status`} className="text-xs text-muted-foreground">
            Board
          </Label>
          <Select value={query.status ?? ANY} onValueChange={handleStatusChange}>
            <SelectTrigger id={`${ids}-status`} size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All boards</SelectItem>
              {TASK_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5 lg:w-40">
          <Label htmlFor={`${ids}-priority`} className="text-xs text-muted-foreground">
            Priority
          </Label>
          <Select value={query.priority ?? ANY} onValueChange={handlePriorityChange}>
            <SelectTrigger id={`${ids}-priority`} size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any priority</SelectItem>
              {TASK_PRIORITIES.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5 lg:w-36">
          <Label htmlFor={`${ids}-sort`} className="text-xs text-muted-foreground">
            Sort
          </Label>
          <div className="flex items-center gap-1.5">
            <Select value={query.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger id={`${ids}-sort`} size="sm" className="min-w-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTABLE_TASK_PROPERTIES.map((property) => (
                  <SelectItem key={property} value={property}>
                    {SORT_LABELS[property]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={handleDirectionToggle}
                  aria-label={
                    isAscending
                      ? 'Sorted ascending. Switch to descending.'
                      : 'Sorted descending. Switch to ascending.'
                  }
                >
                  {isAscending ? <ArrowUpNarrowWideIcon /> : <ArrowDownNarrowWideIcon />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isAscending ? 'Ascending' : 'Descending'}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="col-span-2 justify-self-start text-muted-foreground sm:col-span-1"
            onClick={handleClearFilters}
          >
            <XIcon />
            Clear filters
          </Button>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 lg:justify-end">
        {isBusy && <Spinner label="Loading tasks" size="sm" className="text-muted-foreground" />}
        <Button type="button" onClick={onNewTask}>
          <PlusIcon />
          New task
        </Button>
      </div>
    </div>
  )
}
