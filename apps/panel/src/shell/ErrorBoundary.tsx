import { Component, type ReactNode } from "react";

interface Props {
  name: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/* One feature throwing while it renders shouldn't blank the whole shell —
   show an inline message instead.

   Note this no longer has to cope with a feature failing to *load*: features
   are build-time lazy imports resolved from this app's own bundle, not
   remoteEntry.js fetched cross-origin at runtime, so there is no network
   round-trip left to fail. That's what retired lib/remote.ts and its retry
   machinery. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(`[panel] "${this.props.name}" crashed while rendering:`, error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm font-medium text-foreground">Something went wrong in {this.props.name}.</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
