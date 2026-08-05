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
      {/* design-brief.md §4.4's H2 row. Was `text-lg font-semibold` (18px/600)
          — an inherited pre-rebrand default, not a binder design decision, and
          weight 600 is banned by anti-goal 9. Retokened under §5.6's
          values-and-mechanism amendment. */}
      <h2 className="text-balance text-[28px] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[36px]">
        Recent Updates
      </h2>
      <ul className="flex flex-col gap-4">
        {recent.map((entry, index) => {
          const visibleChanges = entry.changes.slice(0, MAX_CHANGES_SHOWN);
          const hiddenCount = entry.changes.length - visibleChanges.length;

          return (
            <li
              key={`${entry.publishedAt}-${index}`}
              className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              {/* --fg-muted, not neutral-500/400: #737373 was a 4.74:1 pass on
                  the old #ffffff page and became a 4.43:1 FAIL once --bg moved
                  to #F7F7F8. The token is mode-aware, so it replaces the pair
                  rather than sitting alongside a `dark:` override — 7.27:1
                  light (was 4.43), 7.66:1 dark (was 7.71, no regression). */}
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm text-fg-muted">
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
                <p className="mt-1 text-sm text-fg-muted">
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
