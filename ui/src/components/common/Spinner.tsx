interface SpinnerProps {
  readonly label: string
  readonly size?: 'sm' | 'md'
}

/** Indeterminate progress indicator. The label is announced, never drawn. */
export function Spinner({ label, size = 'md' }: SpinnerProps) {
  return (
    <span className={`spinner spinner--${size}`} role="status">
      <span className="visually-hidden">{label}</span>
    </span>
  )
}
