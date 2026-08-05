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

  // DESIGN.md §5.4's state-dimming rule: the sold treatment desaturates the
  // CARD ART only, never the card's text or its badge. `opacity-60 grayscale`
  // on the whole container composited the copy down to 2.82:1 (light) and
  // filtered the "Sold" chip's --danger fill to a neutral grey pill, erasing
  // the one semantic that badge exists to carry. Scoped to the image element,
  // the copy paints at 17.25:1 / 7.27:1 and the chip stays white-on---danger
  // at 5.65:1.
  const soldArtClasses = isSold ? "opacity-60 grayscale" : "";

  const cardBody = (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border transition-[border-color] duration-150 ease-out group-hover:border-brand motion-reduce:transition-none">
      <div className="relative aspect-square w-full bg-surface">
        {showPlaceholder ? (
          <Placeholder
            className={`h-full w-full ${soldArtClasses}`}
            label={listing.name}
          />
        ) : (
          <Image
            src={listing.image}
            alt={listing.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={`object-cover ${soldArtClasses}`}
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
        {/* H3 per design-brief.md §4.4's card-title row: 20/22px at 700. */}
        <h3 className="text-balance text-[20px] leading-[1.25] font-bold tracking-[-0.01em] text-fg sm:text-[22px]">
          {listing.name}
        </h3>
        <p className="text-sm text-fg-muted">{listing.set}</p>
        <p className="font-medium text-fg">{formatPrice(listing.price, currency)}</p>
        {listing.description && <p className="text-xs text-fg-muted">{listing.description}</p>}
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
      // Same hover language as ContentCard/QuickLinks: border -> --brand plus
      // a 2px lift, no soft shadow (design-brief.md §5.4/§5.5, §4.6 motion).
      // The border itself lives on cardBody's container, driven from here via
      // `group` (the sold path renders cardBody with no group ancestor, so
      // that variant simply never fires — correct, sold cards aren't links).
      className="group block transition-transform duration-150 ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {cardBody}
      <span className="mt-2 block text-center text-sm font-medium text-brand-strong group-hover:underline group-hover:underline-offset-[3px] dark:text-brand-soft">
        Contact about this card
      </span>
    </Link>
  );
}
