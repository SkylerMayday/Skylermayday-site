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
    <section>
      {/* The grid's cards are h3s, and /shop's only other heading is the page
          h1 — so the document jumped h1 -> h3 (axe `heading-order`, moderate).
          The grid genuinely is a section, it just doesn't need a visible label
          above two filter controls that already say what it contains. */}
      <h2 className="sr-only">Listings</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {listings.map((listing) => (
          <ShopCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}
