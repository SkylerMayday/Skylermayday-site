import Link from "next/link";

interface QuickLink {
  title: string;
  description: string;
  href: string;
}

const QUICK_LINKS: QuickLink[] = [
  {
    title: "PTCG Binders",
    description: "Browse the full Pokédex card collection, shelf by shelf.",
    href: "/projects/ptcg-binders",
  },
  {
    title: "Projects",
    description: "Everything I build and run — current projects and past.",
    href: "/projects",
  },
  {
    title: "Contact",
    description: "Questions, business inquiries, or card offers.",
    href: "/contact",
  },
];

export default function QuickLinks() {
  return (
    <section className="grid grid-cols-1 gap-4 py-16 sm:grid-cols-3 sm:py-24">
      {QUICK_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          // border -> --brand + 2px lift on hover, no soft shadow (design-brief.md
          // §5.4 — "soft shadows on chrome are out"; §4.6 motion spec: 160ms ease-out).
          className="flex flex-col gap-2 rounded-lg border border-border p-5 transition-[border-color,transform] duration-150 ease-out hover:-translate-y-0.5 hover:border-brand motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <h3 className="text-[20px] leading-[1.25] font-bold tracking-[-0.01em] sm:text-[22px]">
            {link.title}
          </h3>
          <p className="text-sm text-fg-muted">{link.description}</p>
        </Link>
      ))}
    </section>
  );
}
