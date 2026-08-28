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
    <div className="loading-screen">
      <p className="state-line">
        <Spinner label={label} size="sm" /> {label}…
      </p>
      {isSlow && <p className="display-accent">{slowMessage}</p>}
    </div>
  )
}
