import { describe, it, expect } from "vitest";
import { normalizeSlot, type RawBinderSlot } from "@/lib/binders";

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
