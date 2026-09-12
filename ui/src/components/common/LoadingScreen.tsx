import { useEffect, useState } from 'react'
import { Spinner } from './Spinner'

interface LoadingScreenProps {
  readonly label: string
  readonly slowMessage: string
  readonly slowAfterMs?: number
}

export function LoadingScreen({ label, slowMessage, slowAfterMs = 5000 }: LoadingScreenProps) {
  const [isSlow, setIsSlow] = useState(false)

  useEffect(() => {
    setIsSlow(false)
    const timer = window.setTimeout(() => {
      setIsSlow(true)
    }, slowAfterMs)

    return () => {
      window.clearTimeout(timer)
    }
  }, [slowAfterMs])

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner label={label} size="sm" />
        {label}…
      </p>
      {isSlow && (
        <p className="max-w-xs text-sm text-muted-foreground/80 animate-in fade-in-0 duration-500">
          {slowMessage}
        </p>
      )}
    </div>
  )
}
