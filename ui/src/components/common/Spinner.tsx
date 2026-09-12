import { Loader2Icon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SpinnerProps {
  readonly label: string
  readonly size?: 'sm' | 'md'
  readonly className?: string
}

export function Spinner({ label, size = 'md', className }: SpinnerProps) {
  return (
    <span role="status" className={cn('inline-flex shrink-0 items-center', className)}>
      <Loader2Icon
        aria-hidden="true"
        className={cn('animate-spin text-current', size === 'sm' ? 'size-3.5' : 'size-4')}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
