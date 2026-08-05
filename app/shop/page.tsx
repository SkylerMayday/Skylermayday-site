import type { Metadata } from "next";
import { loadShopListings } from "@/lib/shop";
import ShopFilters from "@/components/shop/ShopFilters";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: `Shop — ${siteConfig.brandName}`,
};

export default function ShopPage() {
  const listings = loadShopListings();

  return (
    <div className="flex flex-col gap-8 py-16 sm:py-24">
      <h1 className="text-balance text-[40px] leading-[0.98] font-black tracking-[-0.03em] sm:text-[64px]">
        Shop
      </h1>
      <ShopFilters listings={listings} />
    </div>
  );
}
