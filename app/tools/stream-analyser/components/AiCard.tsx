"use client";

import type { AiCardState } from "@/lib/stream-analyser/types";

interface AiCardProps<T> {
  state: AiCardState<T>;
  render: (data: T) => React.ReactNode;
  /** Label shown while loading, e.g. "Rating title…". */
  loadingLabel?: string;
}

/**
 * Shared AI-result renderer — centralises the spinner / "by Claude" footer /
 * error-notice pattern the old app repeated per AI call (title rating,
 * feedback, metrics, discoverability, description analysis).
 */
export function AiCard<T>({ state, render, loadingLabel = "Loading…" }: AiCardProps<T>) {
  if (state.status === "idle") return null;

  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-neutral-200 p-4 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
        <span
          className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent"
          aria-hidden="true"
        />
        {loadingLabel}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        {state.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {render(state.data)}
      <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">✦ by Claude</span>
    </div>
  );
}
