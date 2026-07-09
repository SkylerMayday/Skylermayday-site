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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {spines.map(({ binderId, section }) => (
        <BinderSectionSpine
          key={`${binderId}-${sectionNameToSlug(section.name)}`}
          binderId={binderId}
          section={section}
          completion={computeSectionCompletion(section)}
        />
      ))}
    </div>
  );
}
