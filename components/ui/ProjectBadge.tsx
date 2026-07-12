import type { ReactNode } from "react";

export type ProjectBadgeVariant = "stream-content" | "vibe-coded";

interface ProjectBadgeProps {
  variant: ProjectBadgeVariant;
}

const BADGES: Record<
  ProjectBadgeVariant,
  { label: string; className: string; icon: ReactNode }
> = {
  "stream-content": {
    label: "Stream Content",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    // Broadcast glyph: central dot + two concentric signal arcs each side.
    icon: (
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <path
          d="M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7M6 6a8 8 0 000 12M18 6a8 8 0 010 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  "vibe-coded": {
    label: "Vibe Coded",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    // Code-brackets glyph: </>.
    icon: (
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M9 8l-4 4 4 4M15 8l4 4-4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
};

/** Small labeled pill marking what kind of project a card describes. */
export default function ProjectBadge({ variant }: ProjectBadgeProps) {
  const badge = BADGES[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${badge.className}`}
    >
      {badge.icon}
      {badge.label}
    </span>
  );
}
