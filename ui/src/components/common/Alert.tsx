import { AlertCircleIcon, CheckCircle2Icon, InfoIcon, XIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'

type AlertTone = 'error' | 'info' | 'success'

interface AlertProps {
  readonly tone: AlertTone
  readonly message: string
  readonly onRetry?: () => void
  readonly onDismiss?: () => void
}

const TONE_STYLES: Readonly<Record<AlertTone, string>> = {
  error: 'border-destructive/30 bg-destructive-subtle text-destructive',
  info: 'border-brand/25 bg-brand-subtle text-brand',
  success: 'border-success/25 bg-success-subtle text-success',
}

const TONE_ICONS = {
  error: AlertCircleIcon,
  info: InfoIcon,
  success: CheckCircle2Icon,
} as const

export function Alert({ tone, message, onRetry, onDismiss }: AlertProps) {
  const Icon = TONE_ICONS[tone]

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm',
        'animate-in fade-in-0 slide-in-from-top-1 duration-200',
        TONE_STYLES[tone],
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p className="min-w-0 flex-1 break-words">{message}</p>

      <div className="flex shrink-0 items-center gap-1">
        {onRetry !== undefined && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-current hover:bg-current/10"
            onClick={onRetry}
          >
            Retry
          </Button>
        )}
        {onDismiss !== undefined && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7 text-current hover:bg-current/10"
            onClick={onDismiss}
            aria-label="Dismiss message"
          >
            <XIcon />
          </Button>
        )}
      </div>
    </div>
  )
}
