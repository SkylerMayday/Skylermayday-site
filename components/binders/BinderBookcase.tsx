import type { Binder } from "@/lib/binders";
import { computeSectionCompletion, sectionNameToSlug } from "@/lib/binders";
import BinderSectionSpine from "./BinderSectionSpine";

interface BinderBookcaseProps {
  binders: Binder[];
  /** Plain <h2> label rendered above this cabinet. "Pokédex" / "Personal Collection". */
  heading: string;
  /** One-line message shown centered inside the shelf when this group yields zero spines. */
  emptyMessage: string;
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
 * "Slim Carcase" v8 rebuild (design-brief.md v8 §3.1/§6): the cabinet gains
 * a second `aria-hidden` sibling div, `.binder-cabinet-plinth`, as the LAST
 * child (after `.binder-shelf`) — a flared base/foot with no precedent in
 * v1-v7. The former `.binder-cabinet-crown` is renamed `.binder-cabinet-cap`
 * (same "plain aria-hidden div, zero client logic" pattern). Still no JS,
 * no per-item wrappers, no CSS Grid — v7's cubby-grid idea stays fully
 * abandoned.
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
 *
 * Second-bookshelf rebuild (docs/ptcg-second-bookshelf-spec.md): the
 * component is now single-cabinet-per-instance — `page.tsx` partitions
 * `binder.json`'s binders by shelf membership (`partitionBindersByShelf`)
 * and renders this component once per shelf, passing each group's binders
 * plus a `heading` ("Pokédex" / "Personal Collection") and an `emptyMessage`
 * as props. The populated branch is byte-identical to the pre-rebuild
 * markup (same cap/shelf/plinth structure and spine map). The old
 * page-level `EmptyState` early-return is replaced with an in-cabinet empty
 * branch: full cabinet chrome (cap, shelf, plinth) stays, but the shelf
 * interior shows a single centered message instead of spines, and the
 * cabinet gains the `binder-cabinet-empty` modifier class that drives the
 * CLS min-height reservation in globals.css. Stays a zero-JS server
 * component throughout — no client directive, no hooks, no handlers.
 */
export default function BinderBookcase({
  binders,
  heading,
  emptyMessage,
}: BinderBookcaseProps) {
  const spines = binders.flatMap((binder) =>
    binder.sections.map((section) => ({ binderId: binder.id, section }))
  );
  const isEmpty = spines.length === 0;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{heading}</h2>
      <div
        className={`binder-cabinet relative bg-neutral-50 p-4 dark:bg-neutral-900 sm:p-6${
          isEmpty ? " binder-cabinet-empty" : ""
        }`}
      >
        <div
          className="binder-cabinet-cap -mx-4 -mt-4 sm:-mx-6 sm:-mt-6"
          aria-hidden
        />
        <div className="binder-shelf">
          {isEmpty ? (
            <p className="w-full self-center text-center text-sm text-neutral-500 dark:text-neutral-400">
              {emptyMessage}
            </p>
          ) : (
            spines.map(({ binderId, section }) => (
              <BinderSectionSpine
                key={`${binderId}-${sectionNameToSlug(section.name)}`}
                binderId={binderId}
                section={section}
                completion={computeSectionCompletion(section)}
              />
            ))
          )}
        </div>
        <div
          className="binder-cabinet-plinth -mx-7 -mb-4 sm:-mx-9 sm:-mb-6"
          aria-hidden
        />
      </div>
    </section>
  );
}
