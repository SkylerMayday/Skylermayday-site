import { siteConfig } from "@/data/site-config";

// Always-dark hero plane (design-brief.md RISK 2 / DESIGN.md §3.4): stays
// on --surface-hero/--border-hero in BOTH themes — it does not invert with
// the rest of the page. Full-bleed horizontally via negative margins that
// cancel <main>'s px-4/sm:px-6, content re-constrained to max-w-5xl inside.
export default function Hero() {
  return (
    <section className="-mx-4 border-y border-border-hero bg-surface-hero px-4 py-16 sm:-mx-6 sm:px-6 sm:py-24">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4">
        <h1 className="text-[40px] leading-[0.98] font-black tracking-[-0.03em] text-white sm:text-[64px]">
          {siteConfig.brandName}
        </h1>
        <p className="max-w-xl text-lg leading-[1.5] text-brand-soft sm:text-xl">
          {siteConfig.tagline}
        </p>
        <p className="max-w-xl text-[17px] leading-[1.65] text-fg-muted-hero">
          {siteConfig.heroBlurb}
        </p>
      </div>
    </section>
  );
}
