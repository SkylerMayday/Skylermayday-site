import Link from "next/link";
import ProjectBadge, {
  type ProjectBadgeVariant,
} from "@/components/ui/ProjectBadge";
import ProjectIcon, { type ProjectIconVariant } from "@/components/projects/ProjectIcon";

interface ProjectCardProps {
  title: string;
  description: string;
  badges: ProjectBadgeVariant[]; // 1–2 badges
  icon: ProjectIconVariant;
  reverse?: boolean; // true → icon sits on the right instead of the left
  href?: string; // omit for a non-link card
  external?: boolean; // true → open in new tab (e.g. Games Expedition)
  muted?: boolean; // true → archived/past visual treatment
}

const BASE_CLASSES = "flex items-start gap-4 rounded-lg border border-border p-6";
// Muted (past) treatment. DESIGN.md §5.4's state-dimming rule: dim the SURFACE,
// never the subtree. `opacity-75` on the container composited the text too —
// --fg-muted rendered as rgb(126,122,133) for 4.12:1 light / 4.45:1 dark, both
// below AA. The dimming now lives in the background colour itself
// (bg-surface/75 = rgb(253,253,253) light, rgb(23,18,32) dark), so every child
// paints at its full token value: 18.15:1 title / 7.65:1 body in light,
// 15.33:1 / 7.23:1 in dark. The dashed border carries the state visually.
const MUTED_CLASSES = "border-dashed bg-surface/75";
// Same hover language as ContentCard/QuickLinks/ShopCard: border -> --brand
// plus a 2px lift at 160ms ease-out, no soft shadow (design-brief.md
// §5.4/§5.5 "soft shadows on chrome are out", §4.6 motion table).
const LINK_CLASSES =
  "transition-[border-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-brand motion-reduce:transition-none motion-reduce:hover:translate-y-0";

/**
 * Portfolio card for the /projects landing page — used for both current and
 * past projects. One card per row; the icon alternates side via `reverse`.
 * The Discord bot card is NOT rendered through this (it has a live status
 * widget and stays bespoke in the page).
 */
export default function ProjectCard({
  title,
  description,
  badges,
  icon,
  reverse,
  href,
  external,
  muted,
}: ProjectCardProps) {
  const className = [
    BASE_CLASSES,
    reverse && "flex-row-reverse",
    muted && MUTED_CLASSES,
    href && LINK_CLASSES,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <ProjectIcon variant={icon} />
      <div className={`flex flex-col gap-2 ${reverse ? "text-right" : ""}`}>
        <div className={`flex flex-wrap gap-1.5 ${reverse ? "justify-end" : ""}`}>
          {badges.map((variant) => (
            <ProjectBadge key={variant} variant={variant} />
          ))}
        </div>
        {/* h3: sits under the page's section-level h2s (Current/Past Projects).
            design-brief.md §4.4's card-title row — 20/22px at 700. */}
        <h3 className="text-balance text-[20px] leading-[1.25] font-bold tracking-[-0.01em] sm:text-[22px]">
          {title}
          {external ? <span aria-hidden="true"> &#8599;</span> : null}
        </h3>
        <p className="text-sm text-fg-muted">{description}</p>
      </div>
    </>
  );

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
