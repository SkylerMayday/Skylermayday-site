import type { BinderCompletion } from "@/lib/binders";

interface CompletionBarProps {
  completion: BinderCompletion;
  label?: string;
}

export default function CompletionBar({ completion, label }: CompletionBarProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{label}</span>
          {/* --fg-muted: neutral-500 measured 4.43:1 on the current --bg
              (#F7F7F8) — a pass on the pre-rebrand #ffffff, a fail now. */}
          <span className="text-fg-muted">
            {completion.filled}/{completion.total} ({completion.pct}%)
          </span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        {/* --success (#1F8A5F), not emerald-500: emerald was a third green in
            a palette that already defines one, and it was the most saturated
            element on /projects/ptcg-binders. It also fixes a non-text
            contrast failure nobody had measured — emerald-500 against the
            neutral-200 track is 2.01:1, below WCAG 1.4.11's 3:1 floor for a
            meaningful graphic; --success is 3.43:1 light / 3.50:1 dark. */}
        <div
          className="h-full rounded-full bg-success"
          style={{ width: `${completion.pct}%` }}
        />
      </div>
    </div>
  );
}
