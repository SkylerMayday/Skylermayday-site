# PTCG Binders Page Redesign — Spec

Status: Draft for review
Date: 2026-07-09
Owner: Skyler (Tan Jia Hong / SkylerMayday)
Repo this ships in: `D:\Claude Projects\skylermayday-site` (this is a UI/interaction redesign of an already-live feature — no changes needed in the Android app / PokedexBinderV2 project or its publish pipeline)

---

## Problem Statement

The current `/ptcg-binders` page is a plain grid of binder cards linking to a single long scrollable page per binder (currently just "Pokédex", ~1177 cards across ~15 sections). It works, but doesn't feel like browsing a real card collection — it's a data dump, not a collection to flip through. Skyler wants the bookcase and binder-viewing experience to actually feel like handling physical binders: a shelf you scan visually, and a binder you open and flip through page by page, matching how he (and visitors curious about the collection) actually think about a card binder.

## Goals

1. `/ptcg-binders` reads as a bookshelf of binders you can visually scan, not a data table.
2. Opening a binder feels like a real 9-pocket TCG binder page — a literal 3x3 grid of cards, flipped one page at a time.
3. Large sections (Generation I, Mega Evolutions, VMax, etc.) become individually browsable "binders" on the shelf, so no single binder view is an unmanageable 100+ page scroll.
4. Ship entirely within the existing website repo — zero changes to the Android app, publish pipeline, or `binder.json`/`changelog.json` schema.

## Non-Goals

- **No change to the underlying data model.** The real `binder.json` structure (one "Pokédex" binder containing `sections[]`) is untouched. This is a display-layer reorganization only — each existing `BinderSection` becomes a virtual "binder" for browsing purposes, computed client/server-side from the same data already being fetched.
- **No page-turn animation.** Flipping a page instantly swaps the 3x3 grid content. A skeuomorphic page-curl animation was considered and explicitly deferred — adds complexity and can feel slow on repeated navigation through many pages. (Confirmed by Skyler, 2026-07-09.)
- **No change to completion tracking semantics.** The overall Pokédex completion stat (currently shown on the old single-binder page) is not being removed from the data layer — see Open Questions for where/whether it still surfaces in the new design.
- **No multi-level nesting beyond binder → page → 3x3 slots.** Sections are not further subdivided within a virtual binder beyond page pagination.
- **No changes to the changelog feature's data**, though its presentation in the new layout is an open question below.

## User Stories

**Visitor browsing the collection**
- As a visitor, I want to see a bookshelf of binders that visually hints at what's inside each one, so I can pick one that interests me without reading a text list.
- As a visitor, I want opening a binder to feel like flipping through a real binder page by page, so browsing feels tactile rather than scrolling a spreadsheet.
- As a visitor, I want to jump to a specific page or section quickly, so I'm not clicking "next" dozens of times to find something.
- As a visitor on mobile, I want the page-flip arrows to be easy to tap, so the experience isn't fiddly on a small screen.

**Skyler (site owner)**
- As the owner, I want the bookshelf to automatically grow as new sections appear in the published data, so I don't need a code change every time the Android app publishes something new.
- As the owner, I want this to require zero changes on the Android/publish side, so shipping this redesign doesn't block on or risk the existing publish pipeline.

## Site Map / Routes

| Page | Route | Change |
|---|---|---|
| Bookcase | `/ptcg-binders` | Redesigned: skeuomorphic bookshelf, one spine per **section** (not per top-level binder) |
| Binder viewer | `/ptcg-binders/[binderSlug]/[sectionSlug]` | New nested route — a single section's 3x3 paginated card viewer |
| ~~Old single-binder page~~ | `/ptcg-binders/[binderSlug]` | Superseded by the section-level route above (see Open Questions — whether this route still exists as a section-index, or redirects) |

## Requirements

### Must-Have (P0)

1. **Bookshelf redesign (`/ptcg-binders`)**: renders one shelf spine per section across all published binders (currently ~15 spines from the single "Pokédex" binder's sections — Generation I, Generation II, ..., Mega Evolutions, VMax, etc.). Each spine shows: section name, a completion percentage (reusing the existing `computeSectionCompletion`), and set/theme artwork or a representative visual treatment.
   - Acceptance: grid auto-grows as new sections appear in `binder.json` with no code change (mirrors the existing "no hardcoded binder count" principle in `BinderBookcase.tsx`); renders correctly at 375px/768px with no overflow.
2. **Binder viewer**: clicking a spine opens a 3x3 grid (9 `CardSlot`s per page) of that section's cards, paginated client-side over the existing `BinderSection.slots` array (no new data fetch — same data already loaded for the bookcase).
   - Acceptance: a section with e.g. 47 slots renders across 6 pages (5 full 3x3 pages + 1 partial page); empty/missing slots within a page render using the existing `CardSlot` empty-slot treatment.
3. **Page-flip navigation**: left/right arrow controls move one page at a time, instant swap (no animation). Arrows are disabled (not hidden) at the first/last page boundary.
   - Acceptance: arrow tap/click target is large enough for comfortable mobile touch (min 44x44px tap area); keyboard arrow-key navigation works as a bonus but is not required for P0.
4. **Quick-jump navigation within a binder**: alongside prev/next arrows, a way to jump directly to a page or sub-range without clicking through every page — needed because some sections (e.g. Mega Evolutions, Alternate Forms) are still large enough that page-by-page-only would be tedious.
   - Acceptance: at minimum, a page-number input or dropdown that jumps directly to a given page; exact UI (dropdown vs. slider vs. numbered page-pips) left to the Coder/Design stage's judgment, constrained to what's usable at 375px width.
5. **No data-layer changes**: `lib/binders.ts`'s `Binder`/`BinderSection`/`BinderSlot` types, `fetchBinderFile`, `computeCompletion`, and `computeSectionCompletion` are reused as-is. The only new logic is client-side pagination (chunking a `slots[]` array into groups of 9) and a section→URL-slug mapping.
   - Acceptance: `git diff` for this feature shows zero changes to `lib/binders.ts`'s existing exported function signatures (new helper functions may be added, but nothing existing is broken or removed).
6. **Mobile-responsive**: bookshelf and binder viewer both usable at 375px and 768px — no horizontal scroll, no overlapping elements, tap targets sized for touch.

### Nice-to-Have (P1)

- Overall (all-sections-combined) Pokédex completion stat shown somewhere prominent — e.g. a header stat above the bookshelf — since splitting into per-section spines means no single view currently shows the whole-collection percentage. (Resolve placement in Open Questions.)
- Keyboard navigation (arrow keys) for the binder viewer, for desktop users.
- A "recently updated" indicator on a spine if that section had a changelog entry recently (reusing existing changelog data), so returning visitors can spot what's new without opening every binder.

### Future Considerations (P2)

- If the underlying data model is ever changed to genuinely separate binders (a cross-project change touching the Android app), this display-layer section-as-binder approach would need to be reconciled with real separate binders — not a concern for this spec, flagged for awareness only.
- Search/filter across all sections (e.g. "find card X across every binder") — not requested, not scoped here.

## Resolved (2026-07-09)

- **Route structure**: `/ptcg-binders` becomes the overview page — shows the overall (all-sections-combined) completion % at the top, the full changelog feed below, and the bookshelf of section-spines below that. No separate top-level binder landing page needed; the old `/ptcg-binders/[binderSlug]` full-scroll page is superseded. Section binders live at `/ptcg-binders/[binderSlug]/[sectionSlug]`.
- **Spine artwork**: solid-color spines using each generation's actual game title branding colors (see palette below), not card imagery or generic placeholders — reflects the real Pokémon game box-art identity, which is more recognizable than a single random card thumbnail.

### Spine Color Palette

For sections named after a generation, spine art is a **solid-color block per game title in that generation** (i.e. a spine with N color blocks for N games), using each game's real box-art brand color as a first-pass reference — Coder/design stage may fine-tune exact hex values for contrast/accessibility, but the color *identity* per game should be recognizable:

| Section | Games (→ color blocks) | Reference colors |
|---|---|---|
| Generation I | Red / Green / Blue / Yellow | `#CC2929` red, `#2E8B57` green, `#2A5DBF` blue, `#F2C41B` yellow |
| Generation II | Gold / Silver / Crystal | `#C4A130` gold, `#A8A8B0` silver, `#7FD8D8` crystal cyan |
| Generation III | Ruby / Sapphire / Emerald | `#8B1A2B` ruby, `#1B4C9E` sapphire, `#1F8A5F` emerald |
| Generation IV | Diamond / Pearl / Platinum | `#A8C8E8` diamond, `#F0C8D8` pearl, `#B8C0C8` platinum |
| Generation V | Black / White | `#1A1A1A` black, `#F5F5F0` white |
| Generation VI | X / Y | `#2E6FA8` X-blue, `#C4364B` Y-red |
| Generation VII | Sun / Moon | `#F2941C` sun-orange, `#5B4E9E` moon-purple |
| Generation VIII | Sword / Shield | `#3E9ED4` sword-cyan, `#C4405A` shield-red |
| Generation IX | Scarlet / Violet | `#C4283C` scarlet, `#8C4EA8` violet |

For non-generation sections (Regional Variants, Alternate Forms, Mega Evolutions, VMax, and any other catch-all grouping present in the data), left to the Coder/design stage's judgment per the spec's original delegation — suggested starting direction: a single thematic gradient rather than a multi-color block (since these aren't tied to specific game titles), e.g. Mega Evolutions in a purple/energy gradient, VMax in a bold red/black gradient, Regional Variants in an earth-tone gradient. Not binding — adjust for visual consistency across the shelf.

## Addendum: Mobile Swipe Navigation (2026-07-10)

Requested by Skyler as a follow-up once the binder viewer was live: on mobile, turning pages by tapping the prev/next arrows feels less natural than swiping, given the "flip through a real binder" goal this feature was built around.

- **Behavior**: on touch devices, a horizontal swipe left on the 3x3 grid advances to the next page; swipe right goes to the previous page. Standard swipe-threshold logic (a minimum horizontal distance, tolerant of some vertical drift, distinguishing an intentional swipe from a tap/scroll).
- **Scope decision (confirmed by Skyler)**: swipe is *added alongside* the existing prev/next arrow buttons and `PageJumpControl` dropdown — not a replacement. Buttons and dropdown remain visible and functional on mobile as a fallback for anyone who doesn't swipe, and for accessibility (screen readers, switch control, etc. have no swipe equivalent).
- **Boundary behavior**: swiping past the first or last page is a no-op (matches the existing disabled-arrow-at-boundary behavior) — no wrap-around.
- **Desktop**: unchanged — click arrows or use the page-jump dropdown; no swipe/drag gesture added for mouse/trackpad.
- **Non-goal**: no visual "page drag" follow-the-finger animation — the swipe is a discrete gesture that triggers the same instant page-content swap the arrows already do (consistent with the redesign's original "no page-turn animation" decision above).

## Open Questions

- None blocking. All prior open questions resolved above.

## Timeline Considerations

- No hard deadline.
- Purely additive/replacing an already-shipped feature — no dependency on any other in-flight work.
- Suggested phasing: ship P0 in one pass (bookshelf + binder viewer + pagination + jump-nav), P1 items (overall stat placement, keyboard nav, recently-updated indicator) as a fast follow once the core interaction is validated.
