import Link from "next/link";
import type { CSSProperties } from "react";
import type { BinderSection, BinderCompletion } from "@/lib/binders";
import { sectionNameToSlug } from "@/lib/binders";
import { getSpineScheme } from "./sectionSpineColors";

/** Display-only shorthand so labels fit the fixed 104px spine width
 * (e.g. "Generation I" -> "Gen I"). The full name is still used in the
 * Link's aria-label and the URL slug — this only shortens what's printed
 * on the label plate. */
function shortSectionLabel(name: string): string {
  return name.replace(/^Generation\s+/, "Gen ");
}

interface BinderSectionSpineProps {
  binderId: string; // for the URL (e.g. "pokedex")
  section: BinderSection;
  completion: BinderCompletion;
}

/**
 * One standing binder on the shelf — a clickable vertical spine for a
 * single section, a REAL CSS 3D ring-binder (design-brief.md v5): a
 * `preserve-3d` object back-tilted under the Link's raised-eye
 * perspective so the viewer looks slightly down at the shelf, replacing
 * v1-v4's painted-on 2D shading. Layers:
 *
 *  1. `.binder-obj`      — the 3D wrapper (v5 §2.3): preserve-3d +
 *                          rotateX back-tilt, hinged at the floor, viewed
 *                          from the Link's raised `.binder-scene` eye.
 *                          Hover = "pull the binder off the shelf"
 *                          (v5 §6). Carries --spine-cover for the top
 *                          face (v5 §2.6).
 *  2. Top face           — genuine rotateX(90deg) plane (v5 §2.4): card-
 *                          page edges and cover-board tops seen from
 *                          above (the R4 rings were cut — illegible at
 *                          this foreshortening). Replaces the painted
 *                          top-cap and page-block.
 *  3. Cover-edge ridges  — the cover boards wrapping past the spine
 *                          hinge, translateZ-proud of the face (v5 §2.5).
 *  4. Spine face         — color fill: full-width HORIZONTAL stacked
 *                          bands top-to-bottom for `blocks` schemes,
 *                          single 180deg gradient for `gradient` schemes;
 *                          cylindrical shade above (all kept as-is —
 *                          "keep the colour scheme / design").
 *  5. Label plate        — recessed inset window, spans the whole section.
 *  6. Text scrim+label   — dark scrim (~7.8:1 white-text contrast), ABOVE
 *                          everything so nothing lightens the text
 *                          background.
 *  7. Completion gauge   — thin emerald fill along the plate's base.
 *  8. Contact shadow     — real elliptical shadow where the object meets
 *                          the plank, OUTSIDE the 3D transform so it
 *                          stays glued to the floor plane (v5 §2.7).
 *
 * Colors (`sectionSpineColors.ts`) are frozen and untouched — v5 is a
 * shape/construction rebuild only (the top face's cover strips only
 * DARKEN a frozen hex via color-mix, no new hues). Every spine stands
 * inside a `.binder-shelf` wood box (see BinderBookcase.tsx).
 */
export default function BinderSectionSpine({
  binderId,
  section,
  completion,
}: BinderSectionSpineProps) {
  const scheme = getSpineScheme(section.name);

  /* v5 §2.6: the top face's cover-board strips use the binder's own frozen
     top color, darkened — derived, not a new hex constant. */
  const coverHex = scheme.kind === "blocks" ? scheme.blocks[0] : scheme.from;

  return (
    <Link
      href={`/projects/ptcg-binders/${binderId}/${sectionNameToSlug(section.name)}`}
      aria-label={`${section.name}, ${completion.pct}% complete (${completion.filled} of ${completion.total})`}
      /* binder-scene: the Link owns the perspective + raised eye (see
         globals.css — the top face is only visible from above). pt-3 =
         12px headroom so the top face renders inside the shelf (v5 §2.2);
         cursor-pointer per v5 §9.1.5 (don't rely on preflight); focus
         ring stays on the UNtransformed Link so it never skews (v5 §6). */
      className="binder-scene group relative block cursor-pointer pt-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      {/* The 3D object (v5 §2.3) — preserve-3d wrapper owning the tilt;
          hover transforms live HERE and only here (never two competing
          transforms, v5 §2.9). */}
      <div
        className="binder-obj"
        style={
          {
            "--spine-cover": `color-mix(in srgb, ${coverHex} 65%, black)`,
          } as CSSProperties
        }
      >
        {/* Real top face (v5 §2.4) — rotateX(90deg) plane with page edges,
            cover-board tops, and rings from above. */}
        <div className="binder-top-face" aria-hidden="true" />

        {/* Cover-board ridges (v5 §2.5) — siblings of the spine face so
            they can poke past the footprint. */}
        <div className="binder-cover-edge binder-cover-edge--l" aria-hidden="true" />
        <div className="binder-cover-edge binder-cover-edge--r" aria-hidden="true" />

        {/* Spine face — fixed footprint (no jitter) + rounded asymmetric
            profile. */}
        <div
          className="binder-book binder-ring-lines relative"
          style={{ borderRadius: "3px 5px 4px 3px" }}
        >
          {/* Clips the color fill / shade to the book's rounded profile
              (2D content painted on the spine plane — its overflow-hidden
              does not flatten the 3D, v5 §9.1.2). */}
          <div
            className="relative h-full w-full overflow-hidden"
            style={{ borderRadius: "3px 5px 4px 3px" }}
          >
            {/* Color fill. Blocks: full-width horizontal bands stacked
                top-to-bottom (e.g. Gen I renders red/green/blue/yellow
                top-to-bottom). Gradient: single binder, 180deg (top light
                -> bottom shadow). Frozen palette. */}
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

            {/* Cylindrical shade — dark-both-edges/bright-belly overlay,
                above the color fill, below the label plate (kept, v5
                §2.9). */}
            <div className="binder-cyl-shade" aria-hidden="true" />
          </div>

          {/* Label plate — recessed inset window, spans the whole section
              (one label per binder-collection, not per sub-block). */}
          <div className="binder-label-plate">
            {/* Text scrim + label — strengthened dark scrim, above every
                other layer so nothing lightens the text background. */}
            <div className="binder-label-scrim">
              <span className="line-clamp-2 text-center text-xs font-semibold tracking-wide text-white sm:text-sm">
                {shortSectionLabel(section.name)}
              </span>
            </div>
          </div>

          {/* Completion gauge — thin fill-level bar along the spine's
              base, reading like a "how full is this binder" gauge.
              Numeric value is exposed via the Link's aria-label for
              screen readers. */}
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
      </div>

      {/* Real elliptical contact shadow (v5 §2.7) — OUTSIDE the 3D
          transform so it stays glued to the floor plane. */}
      <span className="binder-contact-shadow" aria-hidden="true" />
    </Link>
  );
}
