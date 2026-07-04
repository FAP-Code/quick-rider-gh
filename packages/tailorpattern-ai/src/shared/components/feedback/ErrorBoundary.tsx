import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '../ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  label?: string
}

interface State {
  hasError: boolean
  error: Error | null
  showDetail: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, showDetail: false }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', this.props.label ?? 'unknown', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mx-auto">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-700 mb-1">
              {this.props.label ? `${this.props.label} failed to load` : 'Something went wrong'}
            </h3>
            <p className="text-xs text-red-500">
              An unexpected error occurred in this section.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => this.setState({ hasError: false, error: null, showDetail: false })}
            >
              Try again
            </Button>
            <button
              type="button"
              onClick={() => this.setState(s => ({ showDetail: !s.showDetail }))}
              className="text-[11px] text-red-400 underline"
            >
              {this.state.showDetail ? 'Hide' : 'Show'} details
            </button>
          </div>
          {this.state.showDetail && this.state.error && (
            <pre className="text-left text-[10px] bg-white border border-red-100 rounded-lg p-3 overflow-auto max-h-40 text-red-600">
              {this.state.error.message}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
