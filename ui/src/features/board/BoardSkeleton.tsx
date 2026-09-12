import { Skeleton } from '../../components/ui/skeleton'
import { TASK_STATUSES } from '../../types/api'

const CARDS_PER_COLUMN = [3, 2, 2] as const

/** Mirrors the real board's grid so the switch to loaded content does not jump. */
export function BoardSkeleton() {
  return (
    <div
      className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3"
      aria-hidden="true"
    >
      {TASK_STATUSES.map((status, columnIndex) => (
        <div
          key={status}
          className="flex flex-col gap-2.5 rounded-xl border bg-muted/40 p-2.5"
        >
          <div className="flex items-center justify-between px-1 pt-0.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-5 w-6 rounded-md" />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: CARDS_PER_COLUMN[columnIndex] ?? 2 }, (_, cardIndex) => (
              <div
                key={cardIndex}
                className="flex flex-col gap-2.5 rounded-lg border bg-card p-3"
              >
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-4.5 w-14 rounded-md" />
                  <Skeleton className="h-4.5 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
