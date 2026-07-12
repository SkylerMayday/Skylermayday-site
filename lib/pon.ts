import { z } from "zod";
import rawLocations from "@/data/pon-locations.json";

/**
 * Packs of Noods location-log data layer — mirrors lib/shop.ts.
 *
 * `cuisine` is a normalized free-string category (e.g. "Udon", "Japanese",
 * "Card Tradeshow", "Event"), deliberately NOT an enum: the data is
 * hand-edited roughly monthly and a novel cuisine should just work rather
 * than fail the build. Trade-off: a typo'd category silently becomes its own
 * stats bucket. The categorization convention lives in
 * `data/pon-locations.json` itself — match an existing value when adding a
 * row unless the spot is genuinely a new category.
 */
export interface PonLocation {
  date: string; // "YYYY-MM" (sortable). Display via formatMonth().
  name: string;
  location: string;
  content: string; // freeform "what happened" (may be "")
  cuisine: string; // normalized category for stats
  guests: string; // "" when none
  notes: string; // "" when none; closure abbreviations expanded via page legend
}

const ponLocationSchema = z.object({
  date: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "date must be YYYY-MM"),
  name: z.string().min(1),
  location: z.string().min(1),
  content: z.string(), // allow "" (anniversary streams)
  cuisine: z.string().min(1),
  guests: z.string(), // allow ""
  notes: z.string(), // allow ""
});

const ponLocationsSchema = z.array(ponLocationSchema);

// Compile-time assert: schema output is assignable to the public interface
// (same trick as shop.ts — no runtime cost, fails the build if they diverge).
type _SchemaMatchesInterface =
  z.infer<typeof ponLocationSchema> extends PonLocation ? true : never;
const _schemaMatchesInterface: _SchemaMatchesInterface = true;
void _schemaMatchesInterface;

/**
 * Reads and validates `data/pon-locations.json` at build time.
 *
 * The Packs of Noods page (app/projects/packs-of-noods/page.tsx) is
 * statically rendered (SSG — no `revalidate`/`dynamic` export), so this runs
 * during `next build`, never per-request. A validation failure fails the
 * build loudly with a message pointing at the offending entry.
 */
export function loadPonLocations(): PonLocation[] {
  const result = ponLocationsSchema.safeParse(rawLocations);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        // issue.path for an array item looks like [index, "fieldName"].
        const index = typeof issue.path[0] === "number" ? issue.path[0] : null;
        const field = issue.path.slice(1).join(".") || "(root)";
        const offending =
          index !== null ? (rawLocations as unknown[])[index] : undefined;
        const nameHint =
          offending && typeof offending === "object" && offending !== null &&
          typeof (offending as Record<string, unknown>).name === "string"
            ? (offending as Record<string, unknown>).name
            : "<unknown>";
        const where =
          index !== null ? `entry #${index} (${nameHint})` : "locations array";
        return `  - ${where}, field "${field}": ${issue.message}`;
      })
      .join("\n");

    throw new Error(
      `Invalid data/pon-locations.json — fix the entry(ies) below and re-commit:\n${details}`
    );
  }

  return result.data;
}

export interface PonStats {
  totalVisits: number;
  distinctLocations: number;
  dateRange: string; // e.g. "Dec 2022 – Jun 2026"
  topCuisine: string;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * "2022-12" → "Dec 2022". Manual parse — `new Date("2022-12")` is parsed as
 * UTC midnight and can render the previous month in +08:00.
 */
export function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

export function computePonStats(locations: PonLocation[]): PonStats {
  const totalVisits = locations.length;

  // Distinct venue *names*, case-insensitive — repeat visits collapse to one.
  const distinctLocations = new Set(
    locations.map((l) => l.name.trim().toLowerCase())
  ).size;

  const dates = locations.map((l) => l.date).sort(); // YYYY-MM sorts lexically
  const dateRange = dates.length
    ? `${formatMonth(dates[0])} – ${formatMonth(dates[dates.length - 1])}`
    : "—";

  const counts = new Map<string, number>();
  for (const l of locations) {
    counts.set(l.cuisine, (counts.get(l.cuisine) ?? 0) + 1);
  }
  let topCuisine = "—";
  let top = 0;
  for (const [cuisine, count] of counts) {
    // first-wins tie-break (insertion order = data order)
    if (count > top) {
      top = count;
      topCuisine = cuisine;
    }
  }

  return { totalVisits, distinctLocations, dateRange, topCuisine };
}
