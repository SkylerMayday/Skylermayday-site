# Spec — Second bookshelf for non-Pokédex binders

Repo this ships in: `D:\Claude Projects\skylermayday-site` (`/ptcg-binders` page). No changes to PokedexBinderV2 or its publish pipeline — this repo only reads `binder.json`, never writes it.

## Problem

`/ptcg-binders` currently renders every binder in `binder.json` flattened into one shared shelf. Skyler wants a second, currently-empty shelf reserved for non-Pokédex binders (Connecting Art, Personal Collection, and future categories), with "Card History" specifically grouped into the existing Pokédex shelf instead. Today the site has no concept of "which shelf a binder belongs to" — everything renders in one `.binder-cabinet`.

Real constraint, not negotiable: this repo cannot originate binder data. `pokedex` is the only binder currently published. `cardHistory` has a wired publish path in the Android app but has never been triggered. `Connecting Art`/`Personal Collection` aren't wired into that app's publish function at all yet (confirmed by reading `PublishRepository.kt` directly). The second shelf must render correctly — genuinely empty, not broken — for an unknown period, and pick up real binders automatically whenever they eventually publish, with zero further website changes required for that to happen.

## Goals

- Two visually identical shelves (same `.binder-cabinet`/`.binder-shelf` treatment already shipped in v8 "Slim Carcase") on one page, grouped by binder membership.
- Shelf 1 (Pokédex) shows exactly what it shows today, unchanged.
- Shelf 2 renders correctly whether it has 0 binders (today) or N binders (whenever PokedexBinderV2 publishes them) — no code change needed when that happens.
- No fabricated placeholder binder/card data anywhere.

## Non-goals

- No new visual design — reuse v8's cabinet/shelf CSS exactly, zero new tokens or structural elements.
- No Android/PokedexBinderV2 work (tracked separately in that project's `handoff.md`).
- No change to how individual binder sections/spines render — only which physical shelf they land in.

## Decisions (resolving the open questions from scoping)

1. **Grouping rule — explicit allowlist, not a denylist.** `SHELF_1_BINDER_IDS = ["pokedex", "cardHistory"]`. Any binder ID not in that list (including ones that don't exist yet) renders on shelf 2. This is the safe default: an unexpected future binder ID never silently vanishes, it just lands in the general "personal collection" shelf until someone decides it deserves shelf 1.
2. **Empty-shelf UX.** Shelf 2 always renders its full cabinet frame (cap, panels, plinth — same as shelf 1). When it has zero binders, the shelf interior shows a centered one-line message instead of a spine grid: **"More binders coming soon."** Not the page-level `ErrorState`/`EmptyState` component (that's for total fetch failure) — a smaller, shelf-scoped message.
3. **Per-shelf heading.** A plain `<h2>` label above each shelf, matching the existing typographic weight already used for "Recent Updates" on this page (no new heading style). Shelf 1: "Pokédex". Shelf 2: "Personal Collection" (Skyler's own phrase for this category).
4. **CLS.** Shelf 1's three-tier `min-height` reservation is unchanged. Shelf 2 starts with a small, simple fixed reservation sized to the empty-state message + cabinet chrome (no live-measurement needed for an empty state — height is static and known). Re-measure and adjust once real content exists, same discipline as shelf 1's constants.
5. **Completion bar scope.** The "Pokédex completion" progress bar at the top of the page filters to `binder.id === "pokedex"` only, not all binders combined. Card History and future Personal Collection binders aren't dex-completion-shaped data (no `dexNumber`/1025 total) — mixing them into one percentage would be meaningless. If Card History or other binders eventually want their own progress indicator, that's a separate, future addition, not retrofitted into this one.

## Requirements (P0 — all required for this to ship)

- [ ] `BinderBookcase` (or the page component) partitions `binders` into two groups by the allowlist rule above, before rendering.
- [ ] Two `.binder-cabinet` blocks render, each with its own `<h2>` label, in the order: Pokédex, then Personal Collection.
- [ ] Shelf 2 renders its full cabinet chrome even with zero binders; shows "More binders coming soon" centered in the shelf interior when empty; renders spines normally (identical to shelf 1's rendering logic) once it has ≥1 binder.
- [ ] Completion bar computation filters to `pokedex` only.
- [ ] Zero new color tokens, zero new CSS techniques — every visual element reuses what v8 already shipped.
- [ ] `BinderBookcase.tsx` (or wherever this logic lands) stays a zero-JS server component — this is pure data partitioning, no client interactivity needed.
- [ ] CLS `min-height` values (both shelves) live-measured against the actual real render, not estimated — same discipline as every prior bookshelf iteration this session.

## P2 — future considerations, not built now

- A per-binder or per-collection-type progress indicator for Card History / Personal Collection, once that data exists and its shape is known.
- Whatever visual/structural changes are needed once real Connecting Art / Personal Collection data actually starts publishing (unknown shape until PokedexBinderV2's publish pipeline is extended) — this spec only guarantees graceful *emptiness*, not a design for populated future content.

## Open questions

None blocking — all real ambiguities were resolved above with Skyler directly this session.
