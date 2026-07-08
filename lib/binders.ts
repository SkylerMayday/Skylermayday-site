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
