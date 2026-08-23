import { Component, type ReactNode } from "react";

interface Props {
  name: string;
  children: ReactNode;
  /* Mount a fresh copy of the remote. The parent (RemoteMount) also changes
     this boundary's key, which is what clears the captured error. */
  onRetry?: () => void;
}

interface State {
  error: Error | null;
}

/* One remote failing to load (network hiccup, bad deploy) shouldn't blank
   the whole host shell — show an inline message instead. Loading is retried
   automatically a few times first (see lib/remote.ts); this is what's left
   when those attempts are exhausted, or when the remote throws while
   rendering. */
export class RemoteBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(`[host] failed to load remote "${this.props.name}":`, error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm font-medium text-foreground">Couldn't load {this.props.name}.</p>
          <button
            type="button"
            onClick={() => (this.props.onRetry ? this.props.onRetry() : window.location.reload())}
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
