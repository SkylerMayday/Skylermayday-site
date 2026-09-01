# PTCG Binder Card Zoom — Spec

Status: Draft for review
Date: 2026-07-10
Owner: Skyler (Tan Jia Hong / SkylerMayday)
Repo this ships in: `D:\Claude Projects\skylermayday-site` (extends the already-shipped binder viewer from `ptcg-binders-redesign-spec.md` — no changes to the Android app, publish pipeline, or `binder.json` schema)

---

## Problem Statement

The binder viewer's 3x3 card grid (`CardSlot`) renders each card as a small `aspect-[5/7]` thumbnail with no way to see it larger. A visitor flipping through a binder to actually look at a card — check the art, read a name they can't make out at thumbnail size — has no way to do that; `CardSlot` is currently a fully static, inert element with no click handler, hover state, or link. This breaks the "feels like handling a physical binder" goal the redesign was built around: with a real binder you pick a card up and look at it closely.

## Goals

1. Tapping/clicking any filled card in the grid opens that card at a size where its art and text are actually legible, without leaving the current page or losing scroll/page position.
2. The interaction feels immediate — open and close are fast, no jank, no layout shift in the grid underneath.
3. Works cleanly at the same breakpoints the rest of the binder viewer already supports (mobile ~375-480px through desktop).
4. Ship without any new dependency, new data fetch, or change to `lib/binders.ts`'s existing exported types/functions.

## Non-Goals

- **No higher-resolution image fetch.** `BinderSlot.imageUrl` is the only image field in the data model; v1 enlarges that same image rather than sourcing/requesting a bigger one. If quality turns out to be a real problem after shipping, that's a separate follow-up (CDN URL pattern investigation, or a data-layer change) — not blocking here.
- **No prev/next navigation inside the zoom view.** v1 is view-and-close: open a card, close it, tap another. Flipping through cards without closing is a plausible fast-follow (see P1) but explicitly cut from v1 to keep the build small.
- **No dedicated card detail route/page.** This is an overlay on the existing binder-viewer page, not new navigation/deep-linking. (Reconsider only if a later need for shareable card links emerges — not requested here.)
- **No pinch-to-zoom/pan gesture inside the modal.** The image is shown at a fixed enlarged size; true pinch-zoom is a P2 nice-to-have, not required to make the card legible.
- **No interaction on empty slots.** Empty slots have no `imageUrl`/`cardId` and nothing to zoom into — they stay inert, matching current behavior.

## User Stories

**Visitor browsing a binder**
- As a visitor, I want to tap a card in the grid and see it large enough to actually look at, so browsing feels like handling a real card instead of squinting at a thumbnail.
- As a visitor, I want to close the zoomed view easily (tap outside, a close button, or Esc on desktop) and land back exactly where I was in the grid, so zooming in doesn't disrupt my place in the binder.
- As a mobile visitor, I want the zoomed card and its close control to be easy to tap without precision, so the interaction isn't fiddly on a small screen.
- As a keyboard/screen-reader user, I want the zoom modal to be reachable and dismissible without a mouse, so the feature isn't mouse-only.

## Requirements

### Must-Have (P0)

1. **Click/tap to open**: tapping or clicking a filled `CardSlot` opens a full-screen modal/lightbox overlay showing that card's `imageUrl` at a substantially larger size (e.g. filling most of the viewport height on mobile, a large fixed max-width on desktop), centered, on a dimmed/dark backdrop.
   - Acceptance: works via both mouse click and touch tap; empty slots (`isSlotFilled()` false) remain non-interactive — no click handler attached, no cursor/hover affordance.
2. **Close interaction**: the modal closes via (a) a visible close button/icon, (b) tapping/clicking the backdrop outside the image, and (c) pressing Esc on desktop. Closing returns focus to the grid with no change to the current page/scroll position underneath.
   - Acceptance: all three close paths work; close button meets the existing 44x44px minimum touch-target convention used elsewhere in the binder viewer (`BinderPageViewer` prev/next buttons, `PageJumpControl`).
3. **No layout shift / no new fetch**: opening the modal reuses the already-loaded `imageUrl` (no new network request beyond what's already loaded for the grid thumbnail); the underlying grid does not reflow or shift when the modal opens/closes.
   - Acceptance: `git diff` shows zero changes to `lib/binders.ts`'s existing exported function signatures or `BinderSlot`/`BinderSection`/`Binder` types; only new UI/component code is added.
4. **Keyboard and screen-reader accessible**: the modal traps focus while open, is announced appropriately (e.g. `role="dialog"`, `aria-modal="true"`, an accessible label using the card's `slotName`), and Esc closes it. Background content is not reachable via Tab while the modal is open.
   - Acceptance: tabbing while the modal is open cycles only within the modal (close button at minimum); Esc closes from anywhere inside it.
5. **Mobile-responsive**: usable at the same breakpoints as the rest of the binder viewer (~375-480px mobile through desktop), no horizontal overflow, image scales to fit viewport without being cropped or distorted (`object-contain`-equivalent behavior, matching `CardSlot`'s existing image treatment).
   - Acceptance: verified at 375px, 480px, and a desktop width with no overflow or distortion.
6. **Respect reduced motion**: any open/close transition follows the existing `@media (prefers-reduced-motion: reduce)` convention already used for the binder-spine hover animation in `globals.css` — reduced or no animation when the user has that preference set.

### Nice-to-Have (P1)

None. v1 is scoped to exactly the P0 list — no caption, no prev/next navigation, no swipe gesture. Not being parked for a fast-follow; revisit only if a real need surfaces later.

### Future Considerations (P2)

- Pinch-to-zoom/pan within the modal for even closer inspection of card detail.
- Investigating a higher-resolution image source (CDN URL pattern or data-layer addition) if the scaled-up thumbnail proves too low-quality in practice after shipping v1.
- Deep-linkable card view (dedicated route) if a sharing use case comes up later.

## Open Questions

- None blocking. Image-source and navigation scope were resolved 2026-07-10 (see Non-Goals).

## Timeline Considerations

- No hard deadline.
- Purely additive to the already-shipped binder viewer — no dependency on other in-flight work.
- Single-pass P0 build only (click-to-open modal, close via 3 paths, accessibility, responsive) — nothing beyond that is planned.
