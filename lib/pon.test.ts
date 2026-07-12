import { describe, it, expect, vi, afterEach } from "vitest";
import {
  loadPonLocations,
  computePonStats,
  formatMonth,
  type PonLocation,
} from "@/lib/pon";

/** Factory for test locations — override only what a test cares about. */
const getMockLocation = (overrides?: Partial<PonLocation>): PonLocation => ({
  date: "2023-05",
  name: "Test Udon Shop",
  location: "Test Mall",
  content: "Udon",
  cuisine: "Udon",
  guests: "",
  notes: "",
  ...overrides,
});

/**
 * Loads lib/pon.ts against a substitute JSON payload without touching the
 * real data file: reset the module registry, mock the JSON module, re-import.
 */
async function loadPonWithData(data: unknown) {
  vi.resetModules();
  vi.doMock("@/data/pon-locations.json", () => ({ default: data }));
  return await import("@/lib/pon");
}

afterEach(() => {
  vi.doUnmock("@/data/pon-locations.json");
  vi.resetModules();
});

describe("formatMonth", () => {
  it('formats "2022-12" as "Dec 2022"', () => {
    expect(formatMonth("2022-12")).toBe("Dec 2022");
  });

  it('formats "2026-01" as "Jan 2026" (no UTC previous-month shift)', () => {
    // new Date("2026-01") parses as UTC midnight and would render "Dec 2025"
    // in +08:00 via getMonth() — the manual parse must not do that.
    expect(formatMonth("2026-01")).toBe("Jan 2026");
  });

  it("formats every month token correctly", () => {
    const expected = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    expected.forEach((label, i) => {
      const mm = String(i + 1).padStart(2, "0");
      expect(formatMonth(`2025-${mm}`)).toBe(`${label} 2025`);
    });
  });
});

describe("computePonStats", () => {
  it("computes the spec's expected stats from the real data file", () => {
    const locations = loadPonLocations();
    const stats = computePonStats(locations);
    // Expected values pinned by specs.md §6: 45 visits, 39 distinct,
    // Dec 2022 – Jun 2026, Udon on top (19).
    expect(stats.totalVisits).toBe(45);
    expect(stats.distinctLocations).toBe(39);
    expect(stats.dateRange).toBe("Dec 2022 – Jun 2026");
    expect(stats.topCuisine).toBe("Udon");
  });

  it("counts total visits including repeat visits to the same venue", () => {
    const locations = [
      getMockLocation({ name: "Umai" }),
      getMockLocation({ name: "Umai" }),
      getMockLocation({ name: "Shimbashi Soba" }),
    ];
    expect(computePonStats(locations).totalVisits).toBe(3);
  });

  it("collapses distinct locations case-insensitively and trims whitespace", () => {
    const locations = [
      getMockLocation({ name: "Umai" }),
      getMockLocation({ name: "umai" }),
      getMockLocation({ name: "  UMAI  " }),
      getMockLocation({ name: "Other Place" }),
    ];
    expect(computePonStats(locations).distinctLocations).toBe(2);
  });

  it("derives the date range from min/max dates regardless of input order", () => {
    const locations = [
      getMockLocation({ date: "2024-06" }),
      getMockLocation({ date: "2022-12" }),
      getMockLocation({ date: "2026-03" }),
      getMockLocation({ date: "2023-01" }),
    ];
    expect(computePonStats(locations).dateRange).toBe("Dec 2022 – Mar 2026");
  });

  it("picks the most frequent cuisine, first-wins on ties (data order)", () => {
    const locations = [
      getMockLocation({ cuisine: "Japanese" }),
      getMockLocation({ cuisine: "Udon" }),
      getMockLocation({ cuisine: "Japanese" }),
      getMockLocation({ cuisine: "Udon" }),
    ];
    // Tie at 2–2: Japanese was inserted first, so it wins.
    expect(computePonStats(locations).topCuisine).toBe("Japanese");
  });

  it("handles a single entry (degenerate same-month range, per spec formula)", () => {
    const stats = computePonStats([getMockLocation({ date: "2022-12" })]);
    expect(stats.totalVisits).toBe(1);
    expect(stats.distinctLocations).toBe(1);
    // Spec §5 defines dateRange unconditionally as "first – last"; with a
    // single entry that yields "Dec 2022 – Dec 2022". Documenting behavior.
    expect(stats.dateRange).toBe("Dec 2022 – Dec 2022");
    expect(stats.topCuisine).toBe("Udon");
  });

  it("returns placeholder em dashes for an empty array", () => {
    const stats = computePonStats([]);
    expect(stats.totalVisits).toBe(0);
    expect(stats.distinctLocations).toBe(0);
    expect(stats.dateRange).toBe("—");
    expect(stats.topCuisine).toBe("—");
  });
});

describe("loadPonLocations", () => {
  it("parses the real data file: 45 entries, all fields present", () => {
    const locations = loadPonLocations();
    expect(locations).toHaveLength(45);
    for (const l of locations) {
      expect(l.date).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
      expect(l.name.length).toBeGreaterThan(0);
      expect(l.location.length).toBeGreaterThan(0);
      expect(l.cuisine.length).toBeGreaterThan(0);
      // content/guests/notes are allowed to be "" but must be strings
      expect(typeof l.content).toBe("string");
      expect(typeof l.guests).toBe("string");
      expect(typeof l.notes).toBe("string");
    }
  });

  it("throws loudly on an invalid month, naming the entry index and name", async () => {
    const bad = [getMockLocation(), getMockLocation({ date: "2022-13", name: "Bad Month Cafe" })];
    const pon = await loadPonWithData(bad);
    expect(() => pon.loadPonLocations()).toThrowError(
      /Invalid data\/pon-locations\.json[\s\S]*entry #1 \(Bad Month Cafe\)[\s\S]*"date": date must be YYYY-MM/
    );
  });

  it("throws on a non-zero-padded month (regex requires MM)", async () => {
    const pon = await loadPonWithData([getMockLocation({ date: "2023-5" })]);
    expect(() => pon.loadPonLocations()).toThrow(/date must be YYYY-MM/);
  });

  it("throws when a required field is missing, naming the field", async () => {
    const missingLocation: Partial<PonLocation> = getMockLocation({
      name: "Missing Field Diner",
    });
    delete missingLocation.location;
    const pon = await loadPonWithData([missingLocation]);
    expect(() => pon.loadPonLocations()).toThrowError(
      /entry #0 \(Missing Field Diner\)[\s\S]*"location"/
    );
  });

  it("throws when a min(1) field is an empty string", async () => {
    const pon = await loadPonWithData([getMockLocation({ cuisine: "" })]);
    expect(() => pon.loadPonLocations()).toThrow(/"cuisine"/);
  });

  it("throws when a field has the wrong type", async () => {
    const pon = await loadPonWithData([
      { ...getMockLocation({ name: "Wrong Type Bistro" }), guests: 3 },
    ]);
    expect(() => pon.loadPonLocations()).toThrowError(
      /entry #0 \(Wrong Type Bistro\)[\s\S]*"guests"/
    );
  });

  it("throws on a non-array root, pointing at the locations array", async () => {
    const pon = await loadPonWithData({ not: "an array" });
    expect(() => pon.loadPonLocations()).toThrowError(
      /locations array, field "\(root\)"/
    );
  });

  it("accepts an empty array (valid, if useless)", async () => {
    const pon = await loadPonWithData([]);
    expect(pon.loadPonLocations()).toEqual([]);
  });

  it("accepts empty content/guests/notes (anniversary-stream shape)", async () => {
    const entry = getMockLocation({ content: "", guests: "", notes: "" });
    const pon = await loadPonWithData([entry]);
    expect(pon.loadPonLocations()).toEqual([entry]);
  });
});
