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
 */
export default function BinderBookcase({ binders }: BinderBookcaseProps) {
  const spines = binders.flatMap((binder) =>
    binder.sections.map((section) => ({ binderId: binder.id, section }))
  );

  if (spines.length === 0) {
    return <EmptyState message="No binders published yet." />;
  }

  return (
    <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-900 sm:p-6">
      {/*
       * Shelf strip: a single wrapping flex row of vertical spines, no JS
       * breakpoint logic. Each BinderSectionSpine sets its own responsive
       * flex-basis (3/4/5 per row) and carries its own plank segment at its
       * base — wrapped rows self-assemble into discrete shelves purely via
       * CSS flex-wrap (see design-brief.md §3.1). `items-end` aligns every
       * spine's base to the same row baseline regardless of height jitter.
       */}
      <div className="flex flex-wrap items-end gap-x-0 gap-y-10">
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
