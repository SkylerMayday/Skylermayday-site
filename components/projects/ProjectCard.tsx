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

const BASE_CLASSES =
  "flex items-start gap-4 rounded-lg border border-neutral-200 p-6 dark:border-neutral-800";
// Muted (past) treatment dims the container only — text colors stay at
// normal contrast so the card remains AA-legible.
const MUTED_CLASSES = "border-dashed bg-neutral-50 opacity-75 dark:bg-neutral-900/40";
const LINK_CLASSES = "transition hover:shadow-md";

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
        {/* h3: sits under the page's section-level h2s (Current/Past Projects). */}
        <h3 className="text-lg font-semibold">
          {title}
          {external ? <span aria-hidden="true"> &#8599;</span> : null}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
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
