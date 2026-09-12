import { KeyboardCode, type ClientRect, type KeyboardCoordinateGetter } from '@dnd-kit/core'
import type { UniqueIdentifier } from '@dnd-kit/core'

const HANDLED_KEYS: readonly string[] = [
  KeyboardCode.Left,
  KeyboardCode.Right,
  KeyboardCode.Up,
  KeyboardCode.Down,
]

/** Where a card visually lands inside the column it is moved to. */
const DROP_INSET_Y = 56

interface Column {
  readonly id: UniqueIdentifier
  readonly rect: ClientRect
}

function centerX(rect: ClientRect): number {
  return rect.left + rect.width / 2
}

/**
 * dnd-kit's default keyboard sensor nudges the dragged item by a fixed number
 * of pixels per arrow press, which never reaches the next column on a board
 * this wide. This getter snaps straight to the adjacent column instead, so one
 * arrow press equals one column in whatever order they are laid out — side by
 * side on a wide screen, stacked on a narrow one.
 */
export const boardKeyboardCoordinates: KeyboardCoordinateGetter = (
  event,
  { currentCoordinates, context: { droppableContainers, droppableRects, collisionRect } },
) => {
  if (!HANDLED_KEYS.includes(event.code)) {
    return undefined
  }

  event.preventDefault()

  if (collisionRect === null) {
    return undefined
  }

  const columns: Column[] = []
  for (const container of droppableContainers.getEnabled()) {
    const rect = droppableRects.get(container.id)
    if (rect !== undefined) {
      columns.push({ id: container.id, rect })
    }
  }

  if (columns.length < 2) {
    return undefined
  }

  // Reading order: top to bottom, then left to right. This matches the stacked
  // single-column layout as well as the side-by-side one.
  columns.sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left)

  // The column the card is currently over is the nearest by horizontal centre,
  // which stays correct while the card is being carried between columns.
  let currentIndex = 0
  let bestDistance = Number.POSITIVE_INFINITY
  for (const [index, column] of columns.entries()) {
    const distance = Math.abs(centerX(column.rect) - centerX(collisionRect))
    if (distance < bestDistance) {
      bestDistance = distance
      currentIndex = index
    }
  }

  const forward = event.code === KeyboardCode.Right || event.code === KeyboardCode.Down
  const nextIndex = currentIndex + (forward ? 1 : -1)

  const target = columns[nextIndex]
  if (target === undefined) {
    // Already at the first or last column: stay put rather than wrapping.
    return undefined
  }

  return {
    x: currentCoordinates.x + (centerX(target.rect) - centerX(collisionRect)),
    y: currentCoordinates.y + (target.rect.top + DROP_INSET_Y - collisionRect.top),
  }
}
