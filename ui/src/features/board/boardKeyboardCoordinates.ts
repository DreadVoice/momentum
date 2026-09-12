import { KeyboardCode, type ClientRect, type KeyboardCoordinateGetter } from '@dnd-kit/core'
import type { UniqueIdentifier } from '@dnd-kit/core'

const HANDLED_KEYS: readonly string[] = [
  KeyboardCode.Left,
  KeyboardCode.Right,
  KeyboardCode.Up,
  KeyboardCode.Down,
]

const DROP_INSET_Y = 56

interface Column {
  readonly id: UniqueIdentifier
  readonly rect: ClientRect
}

function centerX(rect: ClientRect): number {
  return rect.left + rect.width / 2
}

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

  columns.sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left)

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
    return undefined
  }

  return {
    x: currentCoordinates.x + (centerX(target.rect) - centerX(collisionRect)),
    y: currentCoordinates.y + (target.rect.top + DROP_INSET_Y - collisionRect.top),
  }
}
