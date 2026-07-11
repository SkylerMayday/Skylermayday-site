import { env } from "./env";

export class BindersApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BindersApiError";
  }
}

export interface BinderSlot {
  dexNumber: number;
  slotName: string;
  // Observed only as "BASE" in live data. Typed as `string`, not a union,
  // since other slot types (variant/insert slots) may exist that we
  // haven't seen yet — see spec §3.4 [VERIFY] note 2.
  slotType: string;
  slotId: string;
  cardId: string | null; // absent in raw JSON when empty -> normalized to null
  imageUrl: string | null; // absent when empty -> normalized to null
}

export interface BinderSection {
  name: string;
  slots: BinderSlot[];
}

export interface Binder {
  id: string; // e.g. "pokedex"
  name: string; // e.g. "Pokédex"
  sections: BinderSection[];
}

export interface BinderFile {
  schemaVersion: number;
  publishedAt: string; // ISO w/ +08:00 offset
  binders: Binder[];
}

// changes[].type observed only as "ADDED" in live data; REPLACED/REMOVED are
// inferred from changelog summary keys but not seen in a live entry yet.
// Handled defensively everywhere — an unrecognized type string is rendered
// as-is rather than crashing (spec §3.4 [VERIFY] note 3).
export type ChangelogChangeType = "ADDED" | "REPLACED" | "REMOVED" | (string & {});

export interface ChangelogChange {
  type: ChangelogChangeType;
  slotId: string;
  slotName: string;
  cardSet?: string;
}

export interface ChangelogSummary {
  added: number;
  replaced: number;
  removed: number;
  pokedexComplete: number;
  pokedexTotal: number;
}

export interface ChangelogEntry {
  publishedAt: string;
  summary: ChangelogSummary;
  changes: ChangelogChange[];
}

export interface ChangelogFile {
  entries: ChangelogEntry[];
}

export interface BinderCompletion {
  filled: number;
  total: number;
  pct: number;
}

interface RawBinderSlot {
  dexNumber: number;
  slotName: string;
  slotType: string;
  slotId: string;
  cardId?: string | null;
  imageUrl?: string | null;
}

interface RawBinderFile {
  schemaVersion: number;
  publishedAt: string;
  binders: Array<{
    id: string;
    name: string;
    sections: Array<{
      name: string;
      slots: RawBinderSlot[];
    }>;
  }>;
}

function normalizeSlot(raw: RawBinderSlot): BinderSlot {
  return {
    dexNumber: raw.dexNumber,
    slotName: raw.slotName,
    slotType: raw.slotType,
    slotId: raw.slotId,
    cardId: raw.cardId ?? null,
    imageUrl: raw.imageUrl ?? null,
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${env.GITHUB_BINDERS_RAW_BASE}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      // ISR handles revalidation cadence at the page level; this fetch
      // itself doesn't need its own cache directive beyond Next's default
      // for the calling context.
      next: { revalidate: 900 },
    });
  } catch (err) {
    throw new BindersApiError(
      `Network error fetching ${url}: ${(err as Error).message}`
    );
  }

  if (!response.ok) {
    throw new BindersApiError(
      `Fetching ${url} failed: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as T;
}

/**
 * Fetches the binder collection file.
 *
 * Note: the PRD assumed a per-binder `isPublic` visibility flag ("a binder
 * toggled non-public never appears"). The live binder.json has no such
 * field — only public binders appear to be published in the file at all.
 * We do NOT filter on a non-existent field; every binder present in
 * `binders[]` is treated as public (spec §3.4 [VERIFY] note 1, surfaced to
 * Skyler in handoff — confirm the Android app filters non-public binders
 * before publishing).
 */
export async function fetchBinderFile(): Promise<BinderFile> {
  const raw = await fetchJson<RawBinderFile>("/binder.json");

  return {
    schemaVersion: raw.schemaVersion,
    publishedAt: raw.publishedAt,
    binders: raw.binders.map((binder) => ({
      id: binder.id,
      name: binder.name,
      sections: binder.sections.map((section) => ({
        name: section.name,
        slots: section.slots.map(normalizeSlot),
      })),
    })),
  };
}

export async function fetchChangelog(): Promise<ChangelogFile> {
  return fetchJson<ChangelogFile>("/changelog.json");
}

/** A slot is filled iff both `cardId` and `imageUrl` are present (verified from app.js). */
function isSlotFilled(slot: BinderSlot): boolean {
  return Boolean(slot.cardId && slot.imageUrl);
}

function computeSlotsCompletion(slots: BinderSlot[]): BinderCompletion {
  const total = slots.length;
  const filled = slots.filter(isSlotFilled).length;
  const pct = total === 0 ? 0 : Math.round((filled / total) * 100);
  return { filled, total, pct };
}

export function computeCompletion(binder: Binder): BinderCompletion {
  const allSlots = binder.sections.flatMap((section) => section.slots);
  return computeSlotsCompletion(allSlots);
}

export function computeSectionCompletion(
  section: BinderSection
): BinderCompletion {
  return computeSlotsCompletion(section.slots);
}

export function findBinderBySlug(
  file: BinderFile,
  slug: string
): Binder | null {
  return file.binders.find((binder) => binder.id === slug) ?? null;
}

/**
 * Number of card slots shown per binder page — a real 9-pocket TCG binder page.
 */
export const SLOTS_PER_PAGE = 9;

/**
 * The single binder id whose completion drives the page-level
 * "Pokédex completion" bar. Kept separate from SHELF_1_BINDER_IDS on
 * purpose: the completion bar is dex-shaped (dexNumber / 1025-total) and is
 * meaningful ONLY for the pokedex binder — see second-bookshelf spec
 * decision 5. Card History / Personal Collection are not dex-completion data
 * and must not be mixed into this percentage.
 */
export const POKEDEX_BINDER_ID = "pokedex";

/**
 * Explicit ALLOWLIST (not a denylist) of binder ids that render on shelf 1
 * (the "Pokédex" cabinet). Any binder id NOT in this list — including ids
 * that don't exist in binder.json yet — renders on shelf 2 ("Personal
 * Collection"). Safe default: an unexpected future binder id never silently
 * vanishes, it lands on shelf 2 until someone decides it belongs on shelf 1.
 * See second-bookshelf spec decision 1.
 */
export const SHELF_1_BINDER_IDS: readonly string[] = [POKEDEX_BINDER_ID, "cardHistory"];

/**
 * Partitions binders into the two on-page shelves by SHELF_1_BINDER_IDS.
 * Mutually exclusive and exhaustive: every binder lands in exactly one group
 * (id in the allowlist -> shelf1, else -> shelf2). Preserves input order
 * within each group. Pure — safe to call in a server component.
 */
export function partitionBindersByShelf(binders: Binder[]): {
  shelf1: Binder[];
  shelf2: Binder[];
} {
  const shelf1: Binder[] = [];
  const shelf2: Binder[] = [];
  for (const binder of binders) {
    if (SHELF_1_BINDER_IDS.includes(binder.id)) {
      shelf1.push(binder);
    } else {
      shelf2.push(binder);
    }
  }
  return { shelf1, shelf2 };
}

/**
 * Converts a section name into a URL-safe kebab-case slug.
 * "Generation I" -> "generation-i", "VMax" -> "vmax",
 * "Regional Variants" -> "regional-variants".
 *
 * Deterministic and collision-free for the current live section names
 * (all 13 produce distinct slugs — verified). Diacritics are stripped so a
 * future "Pokédex"-style name would slugify cleanly.
 */
export function sectionNameToSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritical marks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // any run of non-alphanumerics -> single hyphen
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}

/**
 * Resolves a section slug back to its BinderSection within a binder.
 * Returns null if no section matches (caller triggers notFound()).
 *
 * If two section names ever slugified to the same value, the FIRST match
 * in section order wins — acceptable because current live data has no
 * collisions; documented so a future collision is a known, findable bug.
 */
export function findSectionBySlug(
  binder: Binder,
  sectionSlug: string
): BinderSection | null {
  return (
    binder.sections.find(
      (section) => sectionNameToSlug(section.name) === sectionSlug
    ) ?? null
  );
}

/**
 * Chunks a slot array into fixed-size pages of SLOTS_PER_PAGE.
 * The last page is a partial page when slots.length % 9 !== 0 — it is
 * returned SHORT (not padded); empty-slot rendering to fill a 3x3 grid is
 * a presentation concern handled in the page component, not here.
 *
 * An empty slots array returns [] (zero pages). Defensive: callers must
 * handle the zero-page case (shouldn't occur in live data — every section
 * has >=33 slots — but a section could in principle be empty).
 */
export function paginateSlots(slots: BinderSlot[]): BinderSlot[][] {
  const pages: BinderSlot[][] = [];
  for (let i = 0; i < slots.length; i += SLOTS_PER_PAGE) {
    pages.push(slots.slice(i, i + SLOTS_PER_PAGE));
  }
  return pages;
}
