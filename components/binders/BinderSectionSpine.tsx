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
 * One standing binder on the shelf — a clickable vertical spine for a single
 * section, a layered CSS "book" object (design-brief.md v3):
 *
 *  1. Book body        — fixed 104x216px (92x184px <=480px) footprint, no
 *                         per-section height/width jitter (v3 §2 + §7.5),
 *                         rounded profile, softened directional base
 *                         shadow (A7).
 *  2. Spine face        — color fill: full-width HORIZONTAL stacked bands
 *                         top-to-bottom for `blocks` schemes (v3 §3,
 *                         reverting v2's side-by-side sub-binders back to
 *                         v1's approved treatment), single 180deg gradient
 *                         for `gradient` schemes; page-block fore-edge
 *                         (A5); cylindrical shade (A1).
 *  3. Top cap           — skewed/clipped light strip, the top cover sliver
 *                         (A4) — the single biggest "it's an object" cue.
 *  4. Label plate       — recessed inset window (A3), spans the whole
 *                         section (one label per binder-collection).
 *  5. Text scrim+label  — strengthened dark scrim (v3 §6), ABOVE everything
 *                         so nothing lightens the text background.
 *  6. Completion gauge  — thin emerald fill along the plate's base.
 *
 * Colors (`sectionSpineColors.ts`) are frozen and untouched — this is a
 * shape/construction rebuild only. Every spine now stands inside a
 * `.binder-shelf` wood box (see BinderBookcase.tsx).
 */
export default function BinderSectionSpine({
  binderId,
  section,
  completion,
}: BinderSectionSpineProps) {
  const scheme = getSpineScheme(section.name);

  return (
    <Link
      href={`/ptcg-binders/${binderId}/${sectionNameToSlug(section.name)}`}
      aria-label={`${section.name}, ${completion.pct}% complete (${completion.filled} of ${completion.total})`}
      className="group relative block pt-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      {/* Book body — overflow-visible so the top cap can poke above it;
          fixed footprint (v3 §2/§7.5, no jitter) + rounded asymmetric
          profile + softened directional base shadow (A7). */}
      <div
        className="binder-book binder-base-shadow binder-ring-lines relative transition-transform duration-150 group-hover:-translate-y-0.5"
        style={{ borderRadius: "3px 5px 4px 3px" }}
      >
        {/* Top cap (A4) — the sliver of the top cover, lit from above. */}
        <div className="binder-top-cap" aria-hidden="true" />

        {/* Spine face — clips the color fill / page-block / shade to the
            book's rounded profile. */}
        <div
          className="relative h-full w-full overflow-hidden"
          style={{ borderRadius: "3px 5px 4px 3px" }}
        >
          {/* Color fill. Blocks: full-width horizontal bands stacked
              top-to-bottom (v3 §3 — v1's approved treatment; e.g. Gen I
              renders red/green/blue/yellow top-to-bottom). Gradient:
              single binder, 180deg (top light -> bottom shadow). */}
          {scheme.kind === "blocks" ? (
            <div className="flex h-full w-full flex-col">
              {scheme.blocks.map((color, index) => (
                <div
                  key={index}
                  className="h-full w-full flex-1"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          ) : (
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `linear-gradient(180deg, ${scheme.from}, ${scheme.to})`,
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
          {/* Text scrim + label (§6) — strengthened dark scrim, above every
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
