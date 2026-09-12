import { useCallback, useId, useState } from 'react'
import { toErrorMessage } from '../../lib/ApiError'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert } from './Alert'
import { Spinner } from './Spinner'

interface ConfirmDialogProps {
  readonly title: string
  readonly body: string
  readonly confirmLabel: string
  readonly confirmationPhrase?: string
  readonly onConfirm: () => Promise<void>
  readonly onClose: () => void
}

/**
 * Destructive confirmation, always rendered open: the caller mounts it only
 * when a confirmation is pending and unmounts it on close.
 */
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
  const phraseId = useId()

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
    <AlertDialog
      open
      onOpenChange={(open) => {
        // Radix reports Escape and overlay dismissal here; ignore both mid-flight.
        if (!open && !isWorking) {
          onClose()
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>

        {error !== null && <Alert tone="error" message={error} />}

        {requiresPhrase && (
          <div className="flex flex-col gap-2">
            <Label htmlFor={phraseId}>
              Type <span className="font-mono font-semibold">{confirmationPhrase}</span> to
              confirm
            </Label>
            <Input
              id={phraseId}
              type="text"
              value={typed}
              disabled={isWorking}
              autoComplete="off"
              onChange={(event) => {
                setTyped(event.target.value)
              }}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={!canConfirm}>
            {isWorking && <Spinner label="Working" size="sm" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
