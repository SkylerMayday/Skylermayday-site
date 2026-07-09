import type { ChangelogEntry } from "@/lib/binders";
import EmptyState from "@/components/ui/EmptyState";

interface ChangelogProps {
  entries: ChangelogEntry[];
  limit?: number;
}

function formatSgt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-SG", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Singapore",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const MAX_CHANGES_SHOWN = 6;

export default function Changelog({ entries, limit = 10 }: ChangelogProps) {
  const recent = entries.slice(0, limit);

  if (recent.length === 0) {
    return <EmptyState message="No changelog entries yet." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">Recent Updates</h2>
      <ul className="flex flex-col gap-4">
        {recent.map((entry, index) => {
          const visibleChanges = entry.changes.slice(0, MAX_CHANGES_SHOWN);
          const hiddenCount = entry.changes.length - visibleChanges.length;

          return (
            <li
              key={`${entry.publishedAt}-${index}`}
              className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                <span>{formatSgt(entry.publishedAt)}</span>
                <span>
                  +{entry.summary.added} / ~{entry.summary.replaced} / -{entry.summary.removed} &middot;{" "}
                  {entry.summary.pokedexComplete}/{entry.summary.pokedexTotal} complete
                </span>
              </div>
              <ul className="flex flex-col gap-1 text-sm">
                {visibleChanges.map((change, changeIndex) => (
                  <li key={`${change.slotId}-${changeIndex}`}>
                    <span className="font-medium">{change.type}</span> — {change.slotName}
                    {change.cardSet ? ` (${change.cardSet})` : ""}
                  </li>
                ))}
              </ul>
              {hiddenCount > 0 && (
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  +{hiddenCount} more
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
