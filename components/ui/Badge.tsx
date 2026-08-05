interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "sold" | "info";
  className?: string;
}

// design-brief.md §5.5: `default` -> brand fill (was neutral-800/neutral-200);
// `sold` -> --danger (was a raw red-600 one-off); `info` -> a neutral dark
// chip for ALL platforms (was a raw blue-600 one-off) so the thumbnail
// carries platform identity instead of the label competing with it.
// `info`'s chip sits on top of arbitrary thumbnail imagery (ContentCard),
// not on the page background, so it uses the literal dark --bg hex
// (#0F0B16) at 85% rather than the theme-toggling `--bg` token — the same
// theme-independent-scrim-over-photography logic already established by
// `.binder-label-scrim` in globals.css (a chip needs to stay legible
// regardless of which site theme is active).
const VARIANT_CLASSES: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-brand text-white",
  sold: "bg-danger text-white",
  info: "bg-[#0F0B16]/85 text-white",
};

export default function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      // font-bold (700), not font-semibold (600): design-brief.md anti-goal 9
      // caps the whole site at {400, 500, 700, 900} and 600 is outside it.
      className={`inline-block rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
