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
    // Retokened off raw violet — violet-100/700 is a near-miss against the
    // brand #9146FF and sat metres from it on /projects, the same
    // two-almost-identical-purples problem the Stage 4 verdict called out for
    // bg-indigo-600. A genuine --brand tint: 5.61:1 light (#6E2FD1 on
    // brand@12% over --bg), 6.40:1 dark (#BF94FF on brand@25%). This variant
    // is the weight REFERENCE — `vibe-coded` is tuned to match it.
    className:
      "bg-brand/12 text-brand-strong dark:bg-brand/25 dark:text-brand-soft",
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
    // Deliberately NOT a second hue — the two badges are already separated by
    // glyph and label, so this one is the quiet/neutral member of the pair
    // rather than importing a green that means nothing in this palette
    // (--success is a status colour, not a category colour).
    //
    // Matched to `stream-content`'s visual weight on BOTH axes, because the
    // previous `bg-border text-fg` was heavier on both and the pair read as a
    // hierarchy that doesn't exist (Stage 4 Q-2). Same recipe shape as the
    // brand variant — a low-alpha wash of a hue with that hue's readable form
    // as text — with the alpha tuned by relative luminance, not by eye:
    //   fill   brand/12  L=0.7889  vs  fg-muted/10  L=0.7947   (dL 0.006)
    //   fill   brand/25  L=0.0195  vs  fg-muted/17  L=0.0195   (dL 0.0001)
    // Previously bg-border sat at L=0.7573 in light — 5x further off.
    //   text   5.61:1 vs 6.26:1 light, 6.40:1 vs 5.95:1 dark (was 5.61 vs
    //          14.20 — the near-black text was half of why it read heavier).
    // All four figures re-checked over ProjectCard's muted surface too, where
    // the lowest is 5.47:1.
    // (No `dark:text-*` needed — --fg-muted is already mode-aware.)
    className: "bg-fg-muted/10 text-fg-muted dark:bg-fg-muted/17",
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
