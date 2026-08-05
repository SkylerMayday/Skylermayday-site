import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center sm:py-24">
      {/* font-black (900), not font-extrabold (800) — 800 is outside
          design-brief.md anti-goal 9's {400,500,700,900} cap. Display row
          sizing, matching every other h1 on the site. */}
      <h1 className="text-[40px] leading-[0.98] font-black tracking-[-0.03em] sm:text-[64px]">404</h1>
      <p className="prose-block text-fg-muted">
        This page doesn&apos;t exist — it may have moved or never existed.
      </p>
      {/* Single primary-button recipe sitewide: --brand fill, white text
          (4.64:1 AA), --brand-strong on hover (design-brief.md §4.6). Was a
          black/white neutral button sitting inside a purple site. */}
      <Link
        href="/"
        className="rounded-lg bg-brand px-4 py-2 font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-strong motion-reduce:transition-none"
      >
        Back to Home
      </Link>
    </div>
  );
}
