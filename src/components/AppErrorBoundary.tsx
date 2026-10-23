import React from "react";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Brightfolio startup error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-xl font-semibold">Brightfolio could not start</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Reload the app and try again. If this keeps happening, share this
            message with support:
          </p>
          <pre className="mt-4 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-xs text-red-700 dark:bg-zinc-950 dark:text-red-300">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-950"
          >
            Reload app
          </button>
        </section>
      </main>
    );
  }
}
