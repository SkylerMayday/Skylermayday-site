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
 * `style.height` attribute (see design-brief.md §3.3.3). Never swap for
 * Math.random()/Date.now(): those differ between SSR and the browser.
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
 * section. Some generation spine blocks are near-white (pearl/white/diamond/
 * crystal), so every band gets a defined outer border and the label sits on
 * a gradient dark scrim (from-black/70) that guarantees >=4.5:1 contrast for
 * white text even over the palest block color (Gen V `#F5F5F0`).
 *
 * Renders as a real physical object: rounded top corners, a left-light/
 * right-dark edge overlay for a cylindrical-highlight illusion, a base
 * shadow seating it on the shelf, and a two-tone wood plank fused to its
 * bottom edge. Because spines have zero horizontal gap and share the same
 * `items-end` baseline, adjacent planks visually fuse into one continuous
 * shelf per wrapped row.
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
      className="group relative block basis-1/3 rounded-t-md pb-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:basis-1/4 lg:basis-1/5"
    >
      {/* Spine body — the standing binder itself. */}
      <div
        className="relative flex flex-col overflow-hidden rounded-t-md rounded-b-none border-t border-white/25 shadow-[0_6px_10px_-4px_rgba(0,0,0,0.45)] transition-transform duration-150 group-hover:-translate-y-0.5 dark:shadow-[0_6px_12px_-4px_rgba(0,0,0,0.7)]"
        style={{ height: `clamp(140px, 40vw, ${spineHeight}px)` }}
      >
        {/* Color fill — stacked horizontal bands (blocks) or a top->bottom
            gradient. Orientation changed from the old side-by-side stripes
            per design-brief.md §3.2; hex values are untouched. */}
        {scheme.kind === "blocks" ? (
          <div className="flex h-full w-full flex-col">
            {scheme.blocks.map((color, index) => (
              <div
                key={index}
                className="w-full flex-1 border-neutral-300 last:border-b-0 dark:border-neutral-700"
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

        {/* Depth overlay: left-light / right-dark edge highlight, faking a
            rounded/cylindrical spine catching light on one side and falling
            into shadow on the other. Sits ABOVE the color fill but BELOW
            the label scrim so it never lightens the text background. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 18%, rgba(255,255,255,0) 42%, rgba(0,0,0,0) 82%, rgba(0,0,0,0.22) 100%)",
          }}
        />

        {/* Label scrim — gradient from-black/70 guarantees >=4.5:1 white-text
            contrast even over the palest spine color (Gen V #F5F5F0). */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/45 to-transparent px-2 pt-6 pb-2">
          <span className="line-clamp-2 text-xs font-semibold text-white sm:text-sm">
            {section.name}
          </span>
        </div>

        {/* Completion gauge — thin fill-level bar pinned to the very bottom
            edge, reading like a "how full is this binder" gauge. Numeric
            value is exposed via the Link's aria-label for screen readers. */}
        <div
          className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25"
          aria-hidden="true"
        >
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${completion.pct}%` }}
          />
        </div>
      </div>

      {/* Wood shelf plank — fused to the spine's base. Adjacent spines in a
          wrapped row share zero horizontal gap, so their planks butt
          together into one continuous shelf (design-brief.md §3.4). */}
      <div
        className="h-3 w-full"
        style={{
          backgroundImage:
            "linear-gradient(180deg, var(--shelf-top-from), var(--shelf-top-to))",
        }}
      />
      <div
        className="h-2 w-full border-t border-white/15 shadow-[0_10px_14px_-6px_rgba(0,0,0,0.35)]"
        style={{ backgroundColor: "var(--shelf-edge)" }}
      />
    </Link>
  );
}
