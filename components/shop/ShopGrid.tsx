import type { ShopListing } from "@/lib/shop";
import ShopCard from "./ShopCard";
import EmptyState from "@/components/ui/EmptyState";

interface ShopGridProps {
  listings: ShopListing[];
}

export default function ShopGrid({ listings }: ShopGridProps) {
  if (listings.length === 0) {
    return <EmptyState message="No cards listed right now." />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {listings.map((listing) => (
        <ShopCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
