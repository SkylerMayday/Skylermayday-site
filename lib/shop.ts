import { z } from "zod";
import rawListings from "@/data/shop-listings.json";

export type ShopStatus = "available" | "sold";

// Keep the exported interface as the hand-written public type so consumers
// (ShopCard, page.tsx) are unaffected. The schema below must stay in sync
// with it — z.infer is asserted-compatible via the satisfies check further down.
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

export const shopListingSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  set: z.string().min(1),
  price: z.number().finite().nonnegative(),
  currency: z.string().min(1).optional(),
  status: z.enum(["available", "sold"]),
  image: z.string().min(1),
  description: z.string().optional(),
  addedAt: z.string().optional(),
});

export const shopListingsSchema = z.array(shopListingSchema);

// Compile-time assert: schema output is assignable to the public interface.
// (No runtime cost; purely a type check that fails the build if they diverge.)
type _SchemaMatchesInterface =
  z.infer<typeof shopListingSchema> extends ShopListing ? true : never;
const _schemaMatchesInterface: _SchemaMatchesInterface = true;
void _schemaMatchesInterface;

/**
 * Reads and validates `data/shop-listings.json` at build time.
 *
 * The shop page (app/shop/page.tsx) is statically rendered (SSG — no
 * `revalidate`/`dynamic` export), so this runs during `next build`, never
 * per-request. A validation failure therefore fails the build loudly and
 * early with a message pointing at the offending listing — the intended
 * hardening behavior (Item 1). This replaces the previous silent-drop
 * behavior, which could render a shop with cards missing and no signal.
 */
export function parseShopListings(data: unknown): ShopListing[] {
  const result = shopListingsSchema.safeParse(data);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        // issue.path for an array item looks like [index, "fieldName"].
        const index = typeof issue.path[0] === "number" ? issue.path[0] : null;
        const field = issue.path.slice(1).join(".") || "(root)";
        const offending =
          index !== null
            ? (data as unknown[])[index]
            : undefined;
        const idHint =
          offending && typeof offending === "object" && offending !== null &&
          typeof (offending as Record<string, unknown>).id === "string"
            ? (offending as Record<string, unknown>).id
            : "<unknown id>";
        const where =
          index !== null
            ? `listing #${index} (id: ${idHint})`
            : "listings array";
        return `  - ${where}, field "${field}": ${issue.message}`;
      })
      .join("\n");

    throw new Error(
      `Invalid data/shop-listings.json — fix the listing(s) below and re-commit:\n${details}`
    );
  }

  return result.data;
}

export function loadShopListings(): ShopListing[] {
  return parseShopListings(rawListings);
}
