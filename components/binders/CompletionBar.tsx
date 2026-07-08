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
          <span className="text-neutral-500 dark:text-neutral-400">
            {completion.filled}/{completion.total} ({completion.pct}%)
          </span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${completion.pct}%` }}
        />
      </div>
    </div>
  );
}
