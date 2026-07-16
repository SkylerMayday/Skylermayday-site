import { describe, it, expect } from "vitest";
import {
  normalizeSlot,
  computeCompletion,
  computeSectionCompletion,
  findBinderBySlug,
  partitionBindersByShelf,
  sectionNameToSlug,
  findSectionBySlug,
  paginateSlots,
  SLOTS_PER_PAGE,
  SHELF_1_BINDER_IDS,
  type RawBinderSlot,
  type BinderSlot,
  type BinderSection,
  type Binder,
  type BinderFile,
} from "@/lib/binders";

/** Factory for raw slots — override only what a test cares about. */
const rawSlot = (overrides?: Partial<RawBinderSlot>): RawBinderSlot => ({
  dexNumber: 25,
  slotName: "Pikachu",
  slotType: "BASE",
  slotId: "slot-25",
  ...overrides,
});

describe("normalizeSlot", () => {
  it("passes through all three fields unchanged when present and non-default", () => {
    const slot = normalizeSlot(
      rawSlot({ language: "JA", remarks: "First edition", isLocked: true })
    );
    expect(slot.language).toBe("JA");
    expect(slot.remarks).toBe("First edition");
    expect(slot.isLocked).toBe(true);
  });

  it("defaults all three fields when absent from raw", () => {
    const slot = normalizeSlot(rawSlot());
    expect(slot.language).toBe("EN");
    expect(slot.remarks).toBeNull();
    expect(slot.isLocked).toBe(false);
  });

  it("defaults language to EN when explicitly null", () => {
    const slot = normalizeSlot(rawSlot({ language: null }));
    expect(slot.language).toBe("EN");
  });

  it("defaults language to EN when an empty string (guard, not bare ??)", () => {
    const slot = normalizeSlot(rawSlot({ language: "" }));
    expect(slot.language).toBe("EN");
  });

  it("defaults language to EN when whitespace-only", () => {
    const slot = normalizeSlot(rawSlot({ language: "   " }));
    expect(slot.language).toBe("EN");
  });

  it("trims surrounding whitespace from a real language code", () => {
    const slot = normalizeSlot(rawSlot({ language: "  KO  " }));
    expect(slot.language).toBe("KO");
  });

  it("normalizes remarks: explicit null stays null", () => {
    const slot = normalizeSlot(rawSlot({ remarks: null }));
    expect(slot.remarks).toBeNull();
  });

  it("normalizes remarks: whitespace-only string is preserved raw (render-side trims, not normalize-side)", () => {
    const slot = normalizeSlot(rawSlot({ remarks: "   " }));
    expect(slot.remarks).toBe("   ");
  });

  it("normalizes isLocked: explicit false stays false", () => {
    expect(normalizeSlot(rawSlot({ isLocked: false })).isLocked).toBe(false);
  });

  it("normalizes isLocked: omitted defaults to false", () => {
    expect(normalizeSlot(rawSlot()).isLocked).toBe(false);
  });

  it("normalizes isLocked: explicit true stays true", () => {
    expect(normalizeSlot(rawSlot({ isLocked: true })).isLocked).toBe(true);
  });

  it("regression: existing fields still normalize correctly", () => {
    const withDefaults = normalizeSlot(rawSlot());
    expect(withDefaults.cardId).toBeNull();
    expect(withDefaults.imageUrl).toBeNull();

    const withValues = normalizeSlot(
      rawSlot({ cardId: "card-1", imageUrl: "https://example.com/1.png" })
    );
    expect(withValues.cardId).toBe("card-1");
    expect(withValues.imageUrl).toBe("https://example.com/1.png");

    const slot = normalizeSlot(
      rawSlot({
        dexNumber: 6,
        slotName: "Charizard",
        slotType: "BASE",
        slotId: "slot-6",
      })
    );
    expect(slot.dexNumber).toBe(6);
    expect(slot.slotName).toBe("Charizard");
    expect(slot.slotType).toBe("BASE");
    expect(slot.slotId).toBe("slot-6");
  });

  it.each(["JA", "KO", "ZH", "FR", "DE", "IT", "ES"])(
    "passes non-EN language code %s through unchanged",
    (code) => {
      const slot = normalizeSlot(rawSlot({ language: code }));
      expect(slot.language).toBe(code);
    }
  );
});

/** Factory for a normalized BinderSlot — override only what a test cares about. Filled by default. */
const slot = (overrides?: Partial<BinderSlot>): BinderSlot => ({
  dexNumber: 1,
  slotName: "Test Slot",
  slotType: "BASE",
  slotId: "slot-1",
  cardId: "card-1",
  imageUrl: "https://example.com/1.png",
  language: "EN",
  remarks: null,
  isLocked: false,
  ...overrides,
});

const section = (name: string, slots: BinderSlot[]): BinderSection => ({
  name,
  slots,
});

const binder = (id: string, sections: BinderSection[], name?: string): Binder => ({
  id,
  name: name ?? id,
  sections,
});

/** N distinct slots, in order, for pagination/order-sensitive assertions. */
const slotsOfLength = (n: number): BinderSlot[] =>
  Array.from({ length: n }, (_, i) =>
    slot({ dexNumber: i, slotId: `slot-${i}`, slotName: `Slot ${i}` })
  );

describe("computeCompletion / computeSectionCompletion", () => {
  it("fully filled section: filled equals total, pct 100", () => {
    const sec = section("A", [slot(), slot(), slot()]);
    expect(computeSectionCompletion(sec)).toEqual({ filled: 3, total: 3, pct: 100 });
  });

  it("all empty: filled 0, pct 0", () => {
    const sec = section("A", [
      slot({ cardId: null, imageUrl: null }),
      slot({ cardId: null, imageUrl: null }),
      slot({ cardId: null, imageUrl: null }),
    ]);
    expect(computeSectionCompletion(sec)).toEqual({ filled: 0, total: 3, pct: 0 });
  });

  it("mixed 1-of-3 filled rounds 33.33 down to 33", () => {
    const sec = section("A", [
      slot(),
      slot({ cardId: null, imageUrl: null }),
      slot({ cardId: null, imageUrl: null }),
    ]);
    expect(computeSectionCompletion(sec)).toEqual({ filled: 1, total: 3, pct: 33 });
  });

  it("mixed 2-of-3 filled rounds 66.66 up to 67", () => {
    const sec = section("A", [
      slot(),
      slot(),
      slot({ cardId: null, imageUrl: null }),
    ]);
    expect(computeSectionCompletion(sec)).toEqual({ filled: 2, total: 3, pct: 67 });
  });

  it("a slot with cardId but no imageUrl is NOT filled", () => {
    const sec = section("A", [slot({ cardId: "card-1", imageUrl: null })]);
    expect(computeSectionCompletion(sec).filled).toBe(0);
  });

  it("a slot with imageUrl but no cardId is NOT filled", () => {
    const sec = section("A", [slot({ cardId: null, imageUrl: "https://example.com/1.png" })]);
    expect(computeSectionCompletion(sec).filled).toBe(0);
  });

  it("computeCompletion aggregates across multiple sections (flatMap)", () => {
    const b = binder("b1", [
      section("A", [slot(), slot()]),
      section("B", [
        slot({ cardId: null, imageUrl: null }),
        slot({ cardId: null, imageUrl: null }),
      ]),
    ]);
    expect(computeCompletion(b)).toEqual({ filled: 2, total: 4, pct: 50 });
  });

  it("empty binder (no sections) yields filled:0, total:0, pct:0", () => {
    const b = binder("b1", []);
    expect(computeCompletion(b)).toEqual({ filled: 0, total: 0, pct: 0 });
  });

  it("empty section (no slots) yields filled:0, total:0, pct:0", () => {
    const sec = section("A", []);
    expect(computeSectionCompletion(sec)).toEqual({ filled: 0, total: 0, pct: 0 });
  });
});

describe("findBinderBySlug", () => {
  it("returns the binder whose id matches slug", () => {
    const file: BinderFile = {
      schemaVersion: 1,
      publishedAt: "2026-01-01T00:00:00+08:00",
      binders: [binder("pokedex", [])],
    };
    expect(findBinderBySlug(file, "pokedex")).toEqual(binder("pokedex", []));
  });

  it("returns null when no id matches", () => {
    const file: BinderFile = {
      schemaVersion: 1,
      publishedAt: "2026-01-01T00:00:00+08:00",
      binders: [binder("pokedex", [])],
    };
    expect(findBinderBySlug(file, "nonexistent")).toBeNull();
  });

  it("is case-sensitive", () => {
    const file: BinderFile = {
      schemaVersion: 1,
      publishedAt: "2026-01-01T00:00:00+08:00",
      binders: [binder("pokedex", [])],
    };
    expect(findBinderBySlug(file, "Pokedex")).toBeNull();
  });

  it("returns null for an empty binders array", () => {
    const file: BinderFile = {
      schemaVersion: 1,
      publishedAt: "2026-01-01T00:00:00+08:00",
      binders: [],
    };
    expect(findBinderBySlug(file, "pokedex")).toBeNull();
  });

  it("returns the correct binder among multiple, not just the first", () => {
    const file: BinderFile = {
      schemaVersion: 1,
      publishedAt: "2026-01-01T00:00:00+08:00",
      binders: [binder("pokedex", []), binder("cardHistory", []), binder("personalCollection", [])],
    };
    expect(findBinderBySlug(file, "personalCollection")).toEqual(
      binder("personalCollection", [])
    );
  });
});

describe("partitionBindersByShelf", () => {
  it("puts allowlisted ids (pokedex, cardHistory) into shelf1", () => {
    const binders = [binder("pokedex", []), binder("cardHistory", [])];
    const { shelf1, shelf2 } = partitionBindersByShelf(binders);
    expect(shelf1).toEqual(binders);
    expect(shelf2).toEqual([]);
  });

  it("puts any other id into shelf2", () => {
    const binders = [binder("personalCollection", []), binder("someUnknownFutureId", [])];
    const { shelf1, shelf2 } = partitionBindersByShelf(binders);
    expect(shelf1).toEqual([]);
    expect(shelf2).toEqual(binders);
  });

  it("is exhaustive and mutually exclusive: every binder appears exactly once", () => {
    const binders = [
      binder("pokedex", []),
      binder("personalCollection", []),
      binder("cardHistory", []),
      binder("someUnknownFutureId", []),
    ];
    const { shelf1, shelf2 } = partitionBindersByShelf(binders);
    expect(shelf1.length + shelf2.length).toBe(binders.length);
    const shelf1Ids = new Set(shelf1.map((b) => b.id));
    const shelf2Ids = new Set(shelf2.map((b) => b.id));
    for (const id of shelf1Ids) {
      expect(shelf2Ids.has(id)).toBe(false);
    }
  });

  it("preserves input order within each group", () => {
    const personalA = binder("personalA", []);
    const pokedex = binder("pokedex", []);
    const personalB = binder("personalB", []);
    const cardHistory = binder("cardHistory", []);
    const { shelf1, shelf2 } = partitionBindersByShelf([
      personalA,
      pokedex,
      personalB,
      cardHistory,
    ]);
    expect(shelf1).toEqual([pokedex, cardHistory]);
    expect(shelf2).toEqual([personalA, personalB]);
  });

  it("returns empty groups for empty input", () => {
    expect(partitionBindersByShelf([])).toEqual({ shelf1: [], shelf2: [] });
  });

  it("shelf2 is empty when input is entirely allowlisted ids", () => {
    const binders = SHELF_1_BINDER_IDS.map((id) => binder(id, []));
    const { shelf2 } = partitionBindersByShelf(binders);
    expect(shelf2).toEqual([]);
  });

  it("shelf1 is empty when input has no allowlisted ids", () => {
    const binders = [binder("personalCollection", [])];
    const { shelf1 } = partitionBindersByShelf(binders);
    expect(shelf1).toEqual([]);
  });
});

describe("sectionNameToSlug", () => {
  it.each([
    ["Generation I", "generation-i"],
    ["VMax", "vmax"],
    ["Regional Variants", "regional-variants"],
    ["Pokédex", "pokedex"],
    ["A  &  B", "a-b"],
    ["  Hello!  ", "hello"],
  ])("slugifies %s to %s", (input, expected) => {
    expect(sectionNameToSlug(input)).toBe(expected);
  });

  it("is deterministic — same input twice yields the same output", () => {
    expect(sectionNameToSlug("Generation I")).toBe(sectionNameToSlug("Generation I"));
  });
});

describe("findSectionBySlug", () => {
  it("returns the section whose slugified name equals the slug", () => {
    const b = binder("b1", [section("Generation I", [])]);
    expect(findSectionBySlug(b, "generation-i")).toEqual(section("Generation I", []));
  });

  it("returns null when no section slug matches", () => {
    const b = binder("b1", [section("Generation I", [])]);
    expect(findSectionBySlug(b, "generation-ii")).toBeNull();
  });

  it("matches by slugified name, not raw name", () => {
    const b = binder("b1", [section("Generation I", [])]);
    // The raw (unslugified) name used directly as the slug must NOT match.
    expect(findSectionBySlug(b, "Generation I")).toBeNull();
  });

  it("returns null for an empty sections array", () => {
    const b = binder("b1", []);
    expect(findSectionBySlug(b, "generation-i")).toBeNull();
  });
});

describe("paginateSlots", () => {
  it(`exactly ${SLOTS_PER_PAGE} slots yields a single full page`, () => {
    const pages = paginateSlots(slotsOfLength(SLOTS_PER_PAGE));
    expect(pages.length).toBe(1);
    expect(pages[0].length).toBe(SLOTS_PER_PAGE);
  });

  it(`${SLOTS_PER_PAGE + 1} slots yields 2 pages, the last one short (not padded)`, () => {
    const pages = paginateSlots(slotsOfLength(SLOTS_PER_PAGE + 1));
    expect(pages.length).toBe(2);
    expect(pages[0].length).toBe(SLOTS_PER_PAGE);
    expect(pages[1].length).toBe(1);
  });

  it(`${SLOTS_PER_PAGE * 2} slots yields 2 full pages`, () => {
    const pages = paginateSlots(slotsOfLength(SLOTS_PER_PAGE * 2));
    expect(pages.length).toBe(2);
    expect(pages[0].length).toBe(SLOTS_PER_PAGE);
    expect(pages[1].length).toBe(SLOTS_PER_PAGE);
  });

  it("0 slots yields zero pages", () => {
    expect(paginateSlots([])).toEqual([]);
  });

  it("flattening the pages reproduces the original slot order and contents", () => {
    const original = slotsOfLength(SLOTS_PER_PAGE + 1);
    const pages = paginateSlots(original);
    expect(pages.flat()).toEqual(original);
  });
});
