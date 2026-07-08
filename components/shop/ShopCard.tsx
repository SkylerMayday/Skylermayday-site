"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ShopListing } from "@/lib/shop";
import Placeholder from "@/components/ui/Placeholder";
import Badge from "@/components/ui/Badge";

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

interface ShopCardProps {
  listing: ShopListing;
}

export default function ShopCard({ listing }: ShopCardProps) {
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !listing.image || imageError;
  const isSold = listing.status === "sold";
  const currency = listing.currency ?? "SGD";

  const cardBody = (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 ${
        isSold ? "opacity-60 grayscale" : ""
      }`}
    >
      <div className="relative aspect-square w-full bg-neutral-100 dark:bg-neutral-900">
        {showPlaceholder ? (
          <Placeholder className="h-full w-full" label={listing.name} />
        ) : (
          <Image
            src={listing.image}
            alt={listing.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        )}
        {isSold && (
          <span className="absolute right-2 top-2">
            <Badge variant="sold">Sold</Badge>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{listing.name}</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{listing.set}</p>
        <p className="font-medium">{formatPrice(listing.price, currency)}</p>
        {listing.description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{listing.description}</p>
        )}
      </div>
    </div>
  );

  // Sold cards are not clickable-to-buy (P0 acceptance #4) — render as a
  // plain non-interactive block, no CTA, no link.
  if (isSold) {
    return cardBody;
  }

  return (
    <Link
      href={`/contact?item=${encodeURIComponent(listing.id)}`}
      className="block transition hover:shadow-md"
    >
      {cardBody}
      <span className="mt-2 block text-center text-sm font-medium text-blue-600 dark:text-blue-400">
        Contact about this card
      </span>
    </Link>
  );
}
