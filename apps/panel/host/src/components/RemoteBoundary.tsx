import { Component, type ReactNode } from "react";

interface Props {
  name: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/* One remote failing to load (network hiccup, bad deploy) shouldn't blank
   the whole host shell — show an inline message instead. */
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
        <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="text-sm font-medium text-foreground">Couldn't load {this.props.name}.</p>
          <p className="text-xs text-muted-foreground">Try reloading the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
