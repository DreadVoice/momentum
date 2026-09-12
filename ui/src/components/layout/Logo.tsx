import { cn } from '../../lib/utils'

/** The Momentum mark: the chevron from the favicon, on a brand-filled tile. */
export function Logo({ className }: { readonly className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-md bg-brand text-brand-foreground',
        className,
      )}
    >
      <svg viewBox="0 0 32 32" className="size-4.5" fill="none">
        <path
          d="M8 22V10l8 7 8-7v12"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
