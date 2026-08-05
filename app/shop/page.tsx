import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: `Shop — ${siteConfig.brandName}`,
};

/**
 * Coming-soon placeholder (2026-08-05, Skyler's call) — the real listing
 * grid (ShopFilters/ShopCard/lib/shop.ts) is fully built and unchanged, just
 * not wired up here, pending a real card-scanning pipeline into
 * data/shop-listings.json. Swap the body back to `loadShopListings()` +
 * `<ShopFilters listings={listings} />` (see git history, commit before
 * this one) once real inventory exists — nothing to rebuild.
 */
export default function ShopPage() {
  return (
    <div className="flex flex-col items-start gap-4 py-16 sm:py-24">
      <h1 className="text-balance text-[40px] leading-[0.98] font-black tracking-[-0.03em] sm:text-[64px]">
        Shop
      </h1>
      <p className="prose-block text-fg-muted">
        The shop is on pause while I build a better way to get cards listed here.
        Check back soon, or reach out directly if you&apos;re after something specific.
      </p>
      <Link
        href="/contact"
        className="rounded-lg bg-brand px-4 py-2 font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-strong motion-reduce:transition-none"
      >
        Contact me
      </Link>
    </div>
  );
}
