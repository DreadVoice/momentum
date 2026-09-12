import {
  closestCorners,
  pointerWithin,
  type CollisionDetection,
} from '@dnd-kit/core'

/**
 * `pointerWithin` gives the most predictable result while dragging with a
 * mouse or finger, but it resolves to nothing during a keyboard drag because
 * there is no pointer to test. Falling back to `closestCorners` keeps the
 * keyboard path working without changing how pointer dragging feels.
 */
export const boardCollisionDetection: CollisionDetection = (args) => {
  const byPointer = pointerWithin(args)
  return byPointer.length > 0 ? byPointer : closestCorners(args)
}
