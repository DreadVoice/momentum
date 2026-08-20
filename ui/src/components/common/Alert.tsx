interface AlertProps {
  readonly tone: 'error' | 'info' | 'success'
  readonly message: string
  readonly onRetry?: () => void
  readonly onDismiss?: () => void
}

export function Alert({ tone, message, onRetry, onDismiss }: AlertProps) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <p className="alert__message">{message}</p>
      <div className="alert__actions">
        {onRetry !== undefined && (
          <button type="button" className="m-oauth m-sm" onClick={onRetry}>
            Retry
          </button>
        )}
        {onDismiss !== undefined && (
          <button
            type="button"
            className="m-oauth m-sm"
            onClick={onDismiss}
            aria-label="Dismiss message"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}
