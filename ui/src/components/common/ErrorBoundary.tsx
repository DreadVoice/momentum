import { AlertTriangleIcon } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '../ui/button'

interface ErrorBoundaryProps {
  readonly children: ReactNode
  readonly fallbackTitle?: string
}

interface ErrorBoundaryState {
  readonly error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error', error, info.componentStack)
  }

  private readonly handleReset = (): void => {
    this.setState({ error: null })
  }

  override render(): ReactNode {
    const { error } = this.state
    const { children, fallbackTitle = 'Something went wrong' } = this.props

    if (error === null) {
      return children
    }

    return (
      <div
        role="alert"
        className="mx-auto my-12 flex max-w-md flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center shadow-xs"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-destructive-subtle text-destructive">
          <AlertTriangleIcon className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-lg">{fallbackTitle}</h2>
        <p className="text-sm break-words text-muted-foreground">{error.message}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={this.handleReset}>
            Try again
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.location.reload()
            }}
          >
            Reload the page
          </Button>
        </div>
      </div>
    )
  }
}
