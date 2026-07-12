import Link from "next/link";

interface QuickLink {
  title: string;
  description: string;
  href: string;
}

const QUICK_LINKS: QuickLink[] = [
  {
    title: "Shop",
    description: "Browse Pokémon TCG cards available for sale.",
    href: "/shop",
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
    <section className="grid grid-cols-1 gap-4 py-8 sm:grid-cols-3">
      {QUICK_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-5 transition hover:shadow-md dark:border-neutral-800"
        >
          <h3 className="font-semibold">{link.title}</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{link.description}</p>
        </Link>
      ))}
    </section>
  );
}
