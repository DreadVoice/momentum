import { useEffect, type RefObject } from 'react'

/**
 * Closes a transient surface (menu, dialog) on Escape or on a pointer press
 * outside it. Uses native listeners rather than a popover library.
 *
 * `pointerdown` is used instead of `click` so the surface closes before a
 * click lands on whatever is underneath it.
 */
export function useDismissable(
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean,
  onDismiss: () => void,
): void {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent): void => {
      const target = event.target
      if (target instanceof Node && ref.current !== null && !ref.current.contains(target)) {
        onDismiss()
      }
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onDismiss()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [ref, isOpen, onDismiss])
}
