import { useCallback, useState } from 'react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'
import { toErrorMessage } from '../../lib/ApiError'
import { Alert } from './Alert'

interface ConfirmDialogProps {
  readonly title: string
  readonly body: string
  readonly confirmLabel: string
  readonly confirmationPhrase?: string
  readonly onConfirm: () => Promise<void>
  readonly onClose: () => void
}


export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  confirmationPhrase,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('')
  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requiresPhrase = confirmationPhrase !== undefined
  const canConfirm = !isWorking && (!requiresPhrase || typed === confirmationPhrase)

  const handleConfirm = useCallback(() => {
    setIsWorking(true)
    setError(null)

    onConfirm()
      .then(() => {
        onClose()
      })
      .catch((cause: unknown) => {
        setError(toErrorMessage(cause))
        setIsWorking(false)
      })
  }, [onConfirm, onClose])

  return (
    <Modal title={title} onClose={onClose}>
      <div className="confirm">
        {error !== null && <Alert tone="error" message={error} />}
        <p className="confirm__body">{body}</p>

        {requiresPhrase && (
          <label className="field">
            <span className="field__label">
              Type &ldquo;{confirmationPhrase}&rdquo; to confirm
            </span>
            <input
              className="field__input"
              type="text"
              value={typed}
              disabled={isWorking}
              autoComplete="off"
              onChange={(event) => {
                setTyped(event.target.value)
              }}
            />
          </label>
        )}

        <div className="confirm__actions">
          <button type="button" className="m-oauth" onClick={onClose} disabled={isWorking}>
            Cancel
          </button>
          <button
            type="button"
            className="m-primary m-primary--accent"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {isWorking && <Spinner label="Working" size="sm" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
