/**
 * Slug helpers for binder ids.
 *
 * Binder ids observed in the live data (e.g. "pokedex") are already
 * URL-safe, so the slug used in `/ptcg-binders/[binderSlug]` is simply
 * `binder.id` — no transformation needed today. `slugify` exists as a
 * defensive helper in case a future binder id isn't URL-safe; it is not
 * currently applied to any id in the Phase 1 flow.
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
