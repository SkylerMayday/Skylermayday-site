import rawListings from "@/data/shop-listings.json";

export type ShopStatus = "available" | "sold";

export interface ShopListing {
  id: string;
  name: string;
  set: string;
  price: number; // in SGD by default; render with currency formatter
  currency?: string; // default "SGD"
  status: ShopStatus;
  image: string; // path under /public, e.g. "/cards/charizard-base.jpg"
  description?: string;
  addedAt?: string; // ISO, for sort-by-newest
}

const VALID_STATUSES: ShopStatus[] = ["available", "sold"];

function isValidListing(record: unknown): record is ShopListing {
  if (typeof record !== "object" || record === null) return false;
  const r = record as Record<string, unknown>;

  if (typeof r.id !== "string" || r.id.length === 0) return false;
  if (typeof r.name !== "string" || r.name.length === 0) return false;
  if (typeof r.set !== "string" || r.set.length === 0) return false;
  if (typeof r.price !== "number" || r.price < 0) return false;
  if (typeof r.status !== "string" || !VALID_STATUSES.includes(r.status as ShopStatus)) {
    return false;
  }
  if (typeof r.image !== "string" || r.image.length === 0) return false;
  if (r.currency !== undefined && typeof r.currency !== "string") return false;
  if (r.description !== undefined && typeof r.description !== "string") return false;
  if (r.addedAt !== undefined && typeof r.addedAt !== "string") return false;

  return true;
}

/**
 * Reads and validates `data/shop-listings.json`.
 *
 * Imported statically so a malformed JSON file fails the build loudly
 * (spec §6: "Malformed shop-listings.json (bad JSON) -> build fails
 * loudly — correct behavior; Skyler fixes the commit").
 *
 * Individual malformed *records* (missing/invalid field) are dropped with
 * a server warning rather than crashing the whole page — one bad card
 * shouldn't 500 the shop.
 */
export function loadShopListings(): ShopListing[] {
  const listings = rawListings as unknown[];
  const valid: ShopListing[] = [];

  for (const record of listings) {
    if (isValidListing(record)) {
      valid.push(record);
    } else {
      const id =
        typeof (record as Record<string, unknown>)?.id === "string"
          ? (record as Record<string, unknown>).id
          : "<unknown>";
      console.warn(
        `[shop] Dropping malformed shop-listings.json record (id: ${id})`
      );
    }
  }

  return valid;
}
