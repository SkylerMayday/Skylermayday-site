import type { ReactNode } from "react";

export type ProjectIconVariant =
  | "noodles"
  | "pokedex"
  | "waveform"
  | "discord"
  | "mobile-stream"
  | "game-controller";

const ICONS: Record<ProjectIconVariant, ReactNode> = {
  // Steaming noodle bowl.
  noodles: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <path
        d="M4 12h16a8 8 0 01-16 0z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path
        d="M6 12c1-4 2-6 2-8M12 12c0-4 0-6-.5-8M18 12c-1-4-2-6-2-8"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </svg>
  ),
  // Pokédex-style rounded device with a circular lens.
  pokedex: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
      />
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth={1.6} />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
  // Audio waveform bars.
  waveform: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <path
        d="M4 12v2M8 8v8M12 5v14M16 8v8M20 12v2"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  ),
  // Discord "game controller face" glyph, simplified.
  discord: (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <path
        d="M7 8.5c3-1.4 7-1.4 10 0M6 9.5c-1.5 3-1.7 6-1.2 8 1.6.7 3.2 1.1 3.2 1.1l.9-1.4M18 9.5c1.5 3 1.7 6 1.2 8-1.6.7-3.2 1.1-3.2 1.1l-.9-1.4M6 9.5c-.8-2 0-4 1-5M18 9.5c.8-2 0-4-1-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="14" r="1.2" fill="currentColor" />
      <circle cx="14.5" cy="14" r="1.2" fill="currentColor" />
    </svg>
  ),
  // Phone streaming a signal.
  "mobile-stream": (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <rect
        x="7"
        y="3"
        width="10"
        height="18"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
      />
      <path
        d="M15 8a3.2 3.2 0 010 4.6M17.2 6a6.2 6.2 0 010 8.4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <circle cx="12" cy="10.5" r="1.1" fill="currentColor" />
    </svg>
  ),
  // Retro game controller.
  "game-controller": (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <path
        d="M6 9h5m-2.5-2.5v5M15 10h.01M17.5 12.5h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <path
        d="M6.5 9a4 4 0 00-2.4 6.8c.9.9 2.3.6 2.9-.5l1-1.8a2 2 0 011.7-1h4.6a2 2 0 011.7 1l1 1.8c.6 1.1 2 1.4 2.9.5A4 4 0 0017.5 9z"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/** Icon tile shown beside a ProjectCard's content, alternating sides per row. */
export default function ProjectIcon({ variant }: { variant: ProjectIconVariant }) {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
      {ICONS[variant]}
    </div>
  );
}
