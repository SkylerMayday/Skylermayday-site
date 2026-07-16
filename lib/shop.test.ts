import { describe, it, expect } from "vitest";
import { parseShopListings, loadShopListings, type ShopListing } from "@/lib/shop";

/** Factory for a well-formed shop listing — override only what a test cares about. */
const validListing = (overrides?: Partial<ShopListing>): ShopListing => ({
  id: "a",
  name: "Charizard",
  set: "Base Set",
  price: 100,
  currency: "SGD",
  status: "available",
  image: "/cards/charizard.jpg",
  description: "Holo, near mint.",
  addedAt: "2026-01-01",
  ...overrides,
});

/** Invokes a throwing function once and returns the message it threw. */
const captureThrownMessage = (fn: () => unknown): string => {
  try {
    fn();
  } catch (err) {
    return (err as Error).message;
  }
  throw new Error("expected function to throw, but it did not");
};

describe("parseShopListings", () => {
  it("happy path: parses a well-formed array, length and fields intact", () => {
    const result = parseShopListings([validListing(), validListing({ id: "b" })]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(validListing());
    expect(result[1]).toEqual(validListing({ id: "b" }));
  });

  it("parses a listing with only the 6 required fields (optional fields omitted)", () => {
    const minimal = {
      id: "a",
      name: "Charizard",
      set: "Base Set",
      price: 100,
      status: "available" as const,
      image: "/cards/charizard.jpg",
    };
    const result = parseShopListings([minimal]);
    expect(result).toEqual([minimal]);
  });

  it("returns [] for an empty array (valid, no throw)", () => {
    expect(parseShopListings([])).toEqual([]);
  });

  it("throws when a required field (id) is missing, message identifies the field", () => {
    const { id, ...withoutId } = validListing();
    void id;
    const message = captureThrownMessage(() => parseShopListings([withoutId]));
    expect(message).toMatch(/Invalid data\/shop-listings\.json/);
    expect(message).toMatch(/"id"/);
  });

  it("throws when a required field (id) is an empty string", () => {
    expect(() => parseShopListings([validListing({ id: "" })])).toThrow();
  });

  it("throws on a negative price", () => {
    expect(() => parseShopListings([validListing({ price: -5 })])).toThrow();
  });

  it("throws on a non-finite price", () => {
    expect(() => parseShopListings([validListing({ price: Infinity })])).toThrow();
  });

  it("throws on an invalid status enum value", () => {
    expect(() =>
      parseShopListings([validListing({ status: "reserved" as unknown as ShopListing["status"] })])
    ).toThrow();
  });

  it("error message identifies the offending listing by index and id", () => {
    const badListing = { ...validListing({ id: "b" }), price: -5 };
    const message = captureThrownMessage(() => parseShopListings([validListing(), badListing]));
    expect(message).toMatch(/listing #1/);
    expect(message).toMatch(/id: b/);
  });

  it("regression: loadShopListings() reads the real data/shop-listings.json without throwing and yields 3 listings", () => {
    expect(loadShopListings()).toHaveLength(3);
  });
});
