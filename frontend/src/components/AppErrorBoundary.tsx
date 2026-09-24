import { Component, type ErrorInfo, type ReactNode } from "react"

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("The application encountered an unexpected error.", {
      error,
      componentStack: errorInfo.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="route-error" role="alert">
          <section className="route-error-card">
            <span className="route-error-mark" aria-hidden="true">!</span>
            <p className="route-error-eyebrow">WORKSPACE ERROR</p>
            <h1>This section couldn’t load</h1>
            <p className="route-error-copy">
              Reload the workspace to try again. Your saved data remains on the server.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Reload workspace
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

export default AppErrorBoundary
