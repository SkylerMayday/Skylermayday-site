import type { Binder } from "@/lib/binders";
import { computeSectionCompletion, sectionNameToSlug } from "@/lib/binders";
import BinderSectionSpine from "./BinderSectionSpine";
import EmptyState from "@/components/ui/EmptyState";

interface BinderBookcaseProps {
  binders: Binder[];
}

/**
 * Grid designed for N section-spines — was originally one spine per binder,
 * now flattened to one spine per section (a strict superset of the old
 * auto-grow guarantee). Grows automatically as new sections (or binders)
 * appear in binder.json with no code change; an unrecognized section name
 * still renders a valid (fallback-colored) spine via getSpineScheme.
 *
 * v3 rebuild (design-brief.md v3 §4/§7/§7.5): the wrapper is still a
 * "cabinet" back panel (inset shadow — the "layer at the back" Skyler
 * asked for; the buggy zero-height side walls are dropped, not fixed —
 * see globals.css).
 *
 * Row-chunking decision (§7.5): with book width now fixed/capped (~104px,
 * not a `flex-basis` fraction of the row), pre-splitting into a fixed
 * number of shelf groups (tried first) left large dead wood space on
 * desktop whenever a group's spines didn't fill its row width — with only
 * ~13 live sections, 3 groups meant some shelves were only half-full,
 * which visually reads as a broken/empty shelf, not a bookcase. Reverted
 * to a SINGLE continuous `.binder-shelf` that wraps all spines naturally
 * at their fixed width — exactly how the reference's one continuous
 * `.shelf` works (brief §7.5's second, preferred alternative). This wraps
 * to ~9-10 per row on desktop, ~4-5 on tablet, ~3 on mobile, with no
 * empty trailing space unless the very last row is partial (unavoidable
 * and visually normal for any wrapping shelf).
 */
export default function BinderBookcase({ binders }: BinderBookcaseProps) {
  const spines = binders.flatMap((binder) =>
    binder.sections.map((section) => ({ binderId: binder.id, section }))
  );

  if (spines.length === 0) {
    return <EmptyState message="No binders published yet." />;
  }

  return (
    <div className="binder-cabinet relative rounded-xl bg-neutral-50 p-4 dark:bg-neutral-900 sm:p-6">
      <div
        className="binder-cabinet-crown -mx-4 -mt-4 sm:-mx-6 sm:-mt-6"
        aria-hidden
      />
      <div className="binder-shelf">
        {spines.map(({ binderId, section }) => (
          <BinderSectionSpine
            key={`${binderId}-${sectionNameToSlug(section.name)}`}
            binderId={binderId}
            section={section}
            completion={computeSectionCompletion(section)}
          />
        ))}
      </div>
    </div>
  );
}
