import {
  closestCorners,
  pointerWithin,
  type CollisionDetection,
} from '@dnd-kit/core'

export const boardCollisionDetection: CollisionDetection = (args) => {
  const byPointer = pointerWithin(args)
  return byPointer.length > 0 ? byPointer : closestCorners(args)
}
