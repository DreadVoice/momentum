import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react'
import { useDismissable } from '../../hooks/useDismissable'

interface ModalProps {
  readonly title: string
  readonly onClose: () => void
  readonly children: ReactNode
}

export function Modal({ title, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const titleId = useId()

  useDismissable(panelRef, true, onClose)

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    panelRef.current?.focus()

    return () => {
      document.body.style.overflow = overflow
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus()
      }
    }
  }, [])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <div className="modal-backdrop">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
        tabIndex={-1}
      >
        <header className="modal__header">
          <h2 id={titleId} className="modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="icon-btn"
            onClick={handleClose}
            aria-label="Close dialog"
          >
            &#10005;
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}
