import type { ReactNode } from "react";

export type PonFilterIconVariant =
  | "food"
  | "walking"
  | "card-tradeshows"
  | "udon"
  | "other-noodles"
  | "other-food";

const ICONS: Record<PonFilterIconVariant, ReactNode> = {
  // Fork + knife flanking a plate — parent "Food" category, distinct from the noodle bowl.
  food: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth={1.6} />
      <path
        d="M5 5v3M5 5v14M3.5 5v3M6.5 5v3M19 5c-1.2 0-2 1-2 2.4V11c0 .9.6 1.6 1.4 1.8V19M19 5v14"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  // Simple walking figure.
  walking: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <circle cx="13" cy="5" r="1.6" fill="currentColor" />
      <path
        d="M11 8l3 1.5 2.5 2M14 9.5l-1 4 3 4.5M13 13l-3 1.5-1.5 4M13 13l-3.5-1L8 8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  // Trading card with a folded corner, echoing a booth/tradeshow display.
  "card-tradeshows": (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <path
        d="M6 4h9l3 3v13H6z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path
        d="M15 4v3h3"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="2.6" fill="none" stroke="currentColor" strokeWidth={1.4} />
    </svg>
  ),
  // Bowl + chopsticks, simplified relative to ProjectIcon's noodles bowl.
  udon: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <path
        d="M4 13h16a8 8 0 01-16 0z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path
        d="M9 13c0-3 .5-5 .5-7M14 13c0-3-.5-5-.5-7"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinecap="round"
      />
      <path
        d="M15.5 6l3.5-3M17.5 8l3.5-3"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </svg>
  ),
  // Bare noodle-strand squiggle without a bowl, for the "other noodles" bucket.
  "other-noodles": (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <path
        d="M5 6c1.5 1.5 0 3 1.5 4.5S10 12 8.5 13.5 7 16.5 8.5 18M10 6c1.5 1.5 0 3 1.5 4.5S15 12 13.5 13.5s-1.5 3 0 4.5M15 6c1.5 1.5 0 3 1.5 4.5S20 12 18.5 13.5s-1.5 3 0 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </svg>
  ),
  // Domed cloche dish, visually distinct from the noodle bowls for the catch-all bucket.
  "other-food": (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <path
        d="M4 15a8 8 0 0116 0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <path
        d="M3 15h18M12 7V4.5M10.5 4.5h3"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </svg>
  ),
};

interface PonFilterIconProps {
  variant: PonFilterIconVariant;
  /** Visible highlight when this filter is currently selected. */
  active?: boolean;
}

/**
 * Icon tile for the Packs of Noods filter menu — mirrors ProjectIcon's tile
 * treatment but page-scoped (variants here are not part of the shared
 * ProjectIcon registry). All 6 variants share one tile size regardless of
 * top-level vs submenu placement.
 */
export default function PonFilterIcon({ variant, active }: PonFilterIconProps) {
  return (
    <div
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-300 ${
        active
          ? "bg-neutral-200 ring-2 ring-neutral-900 dark:bg-neutral-700 dark:ring-white"
          : "bg-neutral-100 dark:bg-neutral-800"
      }`}
    >
      {ICONS[variant]}
    </div>
  );
}
