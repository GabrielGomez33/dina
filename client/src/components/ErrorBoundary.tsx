import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}
interface State {
  error: Error | null;
}

// Catches render-time crashes anywhere below it so one broken panel never takes
// down the whole console. Pair with the router's RouteError for loader/action
// failures.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Hook for a real telemetry sink later.
    console.error('[DINA] render error:', error, info.componentStack);
  }

  reset = (): void => this.setState({ error: null });

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return (
      <div className="panel error-panel" role="alert">
        <h2>Something went wrong</h2>
        <p className="muted">{error.message}</p>
        <button className="btn" onClick={this.reset}>
          Try again
        </button>
      </div>
    );
  }
}
