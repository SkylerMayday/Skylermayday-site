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
    <div className="flex flex-col gap-8 py-10">
      <h1 className="text-3xl font-bold">Shop</h1>
      <ShopFilters listings={listings} />
    </div>
  );
}
