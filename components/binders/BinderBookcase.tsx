import type { Binder } from "@/lib/binders";
import { computeSectionCompletion, sectionNameToSlug } from "@/lib/binders";
import BinderSectionSpine from "./BinderSectionSpine";
import EmptyState from "@/components/ui/EmptyState";

interface BinderBookcaseProps {
  binders: Binder[];
}

/** Largest possible per-row book count — rows are chunked to this size in
 * JSX (SSR-safe, no JS breakpoint reads) and CSS `flex-wrap` + responsive
 * `flex-basis` on each spine handles how many actually fit per visual row
 * at each breakpoint (design-brief.md v2 §5 C1). */
const SPINES_PER_ROW = 5;

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

/**
 * Grid designed for N section-spines — was originally one spine per binder,
 * now flattened to one spine per section (a strict superset of the old
 * auto-grow guarantee). Grows automatically as new sections (or binders)
 * appear in binder.json with no code change; an unrecognized section name
 * still renders a valid (fallback-colored) spine via getSpineScheme.
 *
 * v2 rebuild (design-brief.md v2 §4/§5): the wrapper is now a "cabinet"
 * (inset back-wall shadow + optional side walls, enclosing the books rather
 * than leaving them floating on page-white), and each chunk of spines
 * renders as an explicit shelf ROW with its own full-width two-plane plank
 * (top surface + front edge) — the plank is no longer a per-book fused
 * segment, so it stays one continuous, sturdy-looking shelf regardless of
 * how the books above it wrap on narrow viewports.
 */
export default function BinderBookcase({ binders }: BinderBookcaseProps) {
  const spines = binders.flatMap((binder) =>
    binder.sections.map((section) => ({ binderId: binder.id, section }))
  );

  if (spines.length === 0) {
    return <EmptyState message="No binders published yet." />;
  }

  const rows = chunk(spines, SPINES_PER_ROW);

  return (
    <div className="binder-cabinet relative flex rounded-xl bg-neutral-50 p-4 dark:bg-neutral-900 sm:p-6">
      {/* Cabinet side wall (B3) — left. */}
      <div className="binder-cabinet-wall mr-3 hidden shrink-0 rounded-sm sm:block" aria-hidden="true" />

      <div className="flex-1 space-y-8">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="relative">
            {/* Shelf books — items-end so height-jittered books share one
                baseline; no horizontal gap, seams (A6) supply separation. */}
            <div className="flex flex-wrap items-end gap-x-0">
              {row.map(({ binderId, section }) => (
                <BinderSectionSpine
                  key={`${binderId}-${sectionNameToSlug(section.name)}`}
                  binderId={binderId}
                  section={section}
                  completion={computeSectionCompletion(section)}
                />
              ))}
            </div>

            {/* Shelf plank (B1) — full-width two-plane plank, one per row,
                sits under the whole row regardless of how it wraps. */}
            <div className="shelf-plank-top" aria-hidden="true" />
            <div className="shelf-plank-edge" aria-hidden="true" />
          </div>
        ))}
      </div>

      {/* Cabinet side wall (B3) — right. */}
      <div className="binder-cabinet-wall ml-3 hidden shrink-0 rounded-sm sm:block" aria-hidden="true" />
    </div>
  );
}
