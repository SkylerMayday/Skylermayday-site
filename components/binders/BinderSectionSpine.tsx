import Link from "next/link";
import type { BinderSection, BinderCompletion } from "@/lib/binders";
import { sectionNameToSlug } from "@/lib/binders";
import { getSpineScheme } from "./sectionSpineColors";

interface BinderSectionSpineProps {
  binderId: string; // for the URL (e.g. "pokedex")
  section: BinderSection;
  completion: BinderCompletion;
}

/**
 * Deterministic string hash (djb2 variant). Used ONLY to pick a stable
 * height-jitter bucket from the section name — must produce the identical
 * result on server and client render, or React hydration mismatches on the
 * `style.height` attribute (see design-brief.md §3.3.3 / v2 §5 C3). Never
 * swap for Math.random()/Date.now(): those differ between SSR and the
 * browser.
 */
function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash);
}

/** Desktop spine heights (px) — jitter bucket picked deterministically per section name. */
const SPINE_HEIGHTS = [168, 176, 184, 192];

/**
 * One standing binder on the shelf — a clickable vertical spine for a single
 * section, rebuilt (design-brief.md v2) as a layered CSS "book" object
 * instead of a flat color band:
 *
 *  1. Book body        — rounded profile, book-to-book seam (A6), directional
 *                         base shadow (A7).
 *  2. Spine face        — color fill (A2: side-by-side sub-binders for
 *                         `blocks`, single 160deg gradient for `gradient`),
 *                         page-block fore-edge (A5), cylindrical shade (A1).
 *  3. Top cap           — skewed/clipped light strip, the top cover sliver
 *                         (A4) — the single biggest "it's an object" cue.
 *  4. Label plate       — recessed inset window (A3), spans the whole
 *                         section (one label per binder-collection).
 *  5. Text scrim+label  — mandatory dark scrim (§6), ABOVE everything so
 *                         nothing lightens the text background.
 *  6. Completion gauge  — thin emerald fill along the plate's base.
 *
 * Colors (`sectionSpineColors.ts`) are frozen and untouched — this is a
 * shape/construction rebuild only.
 */
export default function BinderSectionSpine({
  binderId,
  section,
  completion,
}: BinderSectionSpineProps) {
  const scheme = getSpineScheme(section.name);
  const spineHeight = SPINE_HEIGHTS[hashString(section.name) % SPINE_HEIGHTS.length];

  return (
    <Link
      href={`/ptcg-binders/${binderId}/${sectionNameToSlug(section.name)}`}
      aria-label={`${section.name}, ${completion.pct}% complete (${completion.filled} of ${completion.total})`}
      className="group relative block basis-1/3 pt-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:basis-1/4 lg:basis-1/5"
    >
      {/* Book body — overflow-visible so the top cap can poke above it;
          rounded asymmetric profile (not a perfect rectangle) + book-to-
          book seam (A6) + directional base shadow (A7). */}
      <div
        className="binder-book-seam binder-base-shadow relative transition-transform duration-150 group-hover:-translate-y-0.5"
        style={{
          height: `clamp(140px, 40vw, ${spineHeight}px)`,
          borderRadius: "3px 5px 4px 3px",
        }}
      >
        {/* Top cap (A4) — the sliver of the top cover, lit from above. */}
        <div className="binder-top-cap" aria-hidden="true" />

        {/* Spine face — clips the color fill / page-block / shade to the
            book's rounded profile. */}
        <div
          className="relative h-full w-full overflow-hidden"
          style={{ borderRadius: "3px 5px 4px 3px" }}
        >
          {/* Color fill (A2). Blocks: side-by-side thin sub-binders, each
              with its own seam — N game titles = N books standing together.
              Gradient: single binder, 160deg (top-left light -> bottom-
              right shadow), agreeing with the top-right light source. */}
          {scheme.kind === "blocks" ? (
            <div className="flex h-full w-full flex-row">
              {scheme.blocks.map((color, index) => (
                <div
                  key={index}
                  className="binder-subspine-seam h-full flex-1"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          ) : (
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `linear-gradient(160deg, ${scheme.from}, ${scheme.to})`,
              }}
            />
          )}

          {/* Page-block / fore-edge (A5) — stacked page-edge hint on the
              shadowed right side. */}
          <div className="binder-page-block" aria-hidden="true" />

          {/* Cylindrical shade (A1) — dark-both-edges/bright-belly overlay,
              above the color fill, below the label plate. */}
          <div className="binder-cyl-shade" aria-hidden="true" />
        </div>

        {/* Label plate (A3) — recessed inset window, spans the whole
            section (one label per binder-collection, not per sub-block). */}
        <div className="binder-label-plate">
          {/* Text scrim + label (§6) — mandatory dark scrim, above every
              other layer so nothing lightens the text background. */}
          <div className="binder-label-scrim">
            <span className="line-clamp-2 text-center text-xs font-semibold tracking-wide text-white sm:text-sm">
              {section.name}
            </span>
          </div>
        </div>

        {/* Completion gauge — thin fill-level bar along the spine's base,
            reading like a "how full is this binder" gauge. Numeric value is
            exposed via the Link's aria-label for screen readers. */}
        <div
          className="absolute inset-x-0 bottom-0 h-[3px] overflow-hidden rounded-b-[3px] bg-white/25"
          aria-hidden="true"
        >
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${completion.pct}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
