import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  /** Rendered instead of the default card when set. */
  fallback?: ReactNode;
};

type State = { error: Error | null };

/**
 * Catches render-time errors in its subtree and shows a recoverable card
 * instead of unmounting React to a blank white screen. Key this by the current
 * location (e.g. `<ErrorBoundary key={pathname}>`) so navigating to another
 * route clears the error automatically.
 *
 * React error boundaries must be class components — there is no hook equivalent.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface it in the console for debugging; no external logging.
    console.error("Render error caught by ErrorBoundary:", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <AlertTriangle className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Something went wrong on this page.</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              An unexpected error occurred while rendering. Try again, or reload
              the app.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={this.reset}>
              Try again
            </Button>
            <Button size="sm" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
