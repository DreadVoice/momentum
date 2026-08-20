import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  readonly children: ReactNode
  /** Shown instead of the default panel when the subtree throws. */
  readonly fallbackTitle?: string
}

interface ErrorBoundaryState {
  readonly error: Error | null
}

/**
 * Stops a render-time failure in one branch from unmounting the whole
 * application. Error boundaries must be class components; there is no hook
 * equivalent for `componentDidCatch`.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Replace with the real telemetry sink when one exists.
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
      <div className="error-boundary" role="alert">
        <h2>{fallbackTitle}</h2>
        <p>{error.message}</p>
        <div className="error-boundary__actions">
          <button type="button" className="m-primary" onClick={this.handleReset}>
            Try again
          </button>
          <button
            type="button"
            className="m-oauth"
            onClick={() => {
              window.location.reload()
            }}
          >
            Reload the page
          </button>
        </div>
      </div>
    )
  }
}
