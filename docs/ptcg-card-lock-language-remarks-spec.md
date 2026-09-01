# PTCG Binder Card Lock Icon + Language/Remarks Display — Spec

Status: Draft for review
Date: 2026-07-16
Owner: Skyler (Tan Jia Hong / SkylerMayday)
Repo this ships in: `D:\Claude Projects\skylermayday-site` (extends the already-shipped card zoom from `ptcg-card-zoom-spec.md` — read-only consumer of new fields published by `PokedexBinderV2`, no write access, no changes to that project)

---

## Problem Statement

`PokedexBinderV2` (commit `7921b82`, spec: `PokedexBinderV2/docs/specs/2026-07-15-card-language-lock-remarks.md`) now publishes three additive per-slot fields in `binder.json`: `language` (string, default `"EN"`), `remarks` (nullable free text), and `isLocked` (boolean). Only ever non-default on the Pokédex and Unown binders — the other three binders always publish `"EN"`/`null`/`false`. This website currently has no type for these fields and displays nothing about them: a visitor has no way to see that a slot is locked, what language a physical card is, or any note Skyler attached to it.

## Goals

1. A visitor browsing the binder grid can see at a glance which slots Skyler has locked, without opening the zoom view.
2. A visitor who opens the zoom view on a non-English card can see what language it is.
3. A visitor who opens the zoom view on a card with a remark can read it.
4. Ship without any change to `binder.json`'s schema or `PokedexBinderV2` — this is a pure read-side consumer of fields that already publish today.

## Non-Goals

- **No editing.** This site has zero write access to `binder.json` (existing architectural constraint, unchanged) — display only.
- **No language filter/search across the binder.** Matches `PokedexBinderV2`'s own explicit non-goal for this feature; out of scope here too.
- **No blocking behavior from `isLocked`.** Locking only affects Android-side removal/reassignment. On this site it is purely a visual marker — a locked slot still opens in the zoom modal exactly like any other filled slot.
- **No display of `language`/`remarks` on binders other than Pokédex/Unown.** Those three binders always publish the defaults (`"EN"`/`null`), so the UI will naturally render nothing extra there — not a special-cased exclusion, just a consequence of the data.

## User Stories

- As a visitor scanning the grid, I want to see a small lock indicator on locked slots, so I understand some cards are marked as confirmed/protected without needing to open them.
- As a visitor who opens a card in the zoom view, I want to see its language if it isn't English, so I know I'm looking at e.g. a Japanese print rather than assuming everything is EN.
- As a visitor who opens a card with a note attached, I want to read that note, so I get context Skyler intentionally recorded about that specific card.

## Requirements

### Must-Have (P0)

1. **Data model**: add `language: string`, `remarks: string | null`, `isLocked: boolean` to `BinderSlot` in `lib/binders.ts`, flowing through the existing `RawBinderSlot` → `normalizeSlot()` pipeline with the same optional-in-raw pattern as `cardId`/`imageUrl`. Defaults on missing/malformed input: `language ?? "EN"`, `remarks ?? null`, `isLocked ?? false` — matches the Android side's own defaults, so a slot from an un-migrated/older `binder.json` behaves identically to an explicit default.
   - Acceptance: `git diff` shows no changes to any other existing field or exported function signature.
2. **Lock icon overlay on `CardSlot`**: when a filled slot has `isLocked === true`, render a small lock glyph (new inline SVG, no icon library dependency — matches the `ProjectIcon.tsx`/`PonFilterIcons.tsx` inline-SVG convention already used elsewhere in this repo) absolutely positioned in the top-right corner of the card's `relative` image container, on a small translucent dark circular backing (mirrors both `ShopCard.tsx`'s `absolute right-2 top-2` sold-badge convention on this site and the Android app's own "translucent circular background" lock-icon treatment — cross-platform visual consistency is a bonus, not a requirement).
   - Acceptance: visible only when `isFilled && slot.isLocked`; empty slots and unlocked filled slots render unchanged; icon does not intercept the slot's own click handler (decorative only, `pointer-events-none` or non-interactive `<span>`, not a nested button).
3. **Language badge in `CardZoomModal`**: when the opened card's `language !== "EN"`, show a small badge (reuse `components/ui/Badge.tsx`, `variant="info"`) displaying the language code (e.g. `JA`, `KO`, `ZH`, `FR`, `DE`, `IT`, `ES` — the full enum from the Android spec) positioned top-left of the enlarged image, inside `card-zoom-figure` so it moves with the image and never collides with the modal's own fixed top-right close button.
   - Acceptance: not rendered at all when `language === "EN"` (the common case); renders correctly for all 7 non-English codes.
4. **Remarks block in `CardZoomModal`**: when `remarks` is non-null and non-empty (after trim), render a text block below the enlarged image inside the modal, styled distinctly from the image (small muted panel, matches the existing `imageError` fallback block's visual weight — dark rounded panel with light text).
   - Acceptance: not rendered when `remarks` is `null` or an empty/whitespace-only string.
5. **Props threading**: `CardSlot` passes `slot.language` and `slot.remarks` to `CardZoomModal` as two new props (`isLocked` is consumed entirely within `CardSlot`, not needed by the modal). `CardZoomModalProps` gains `language: string` and `remarks: string | null`.
   - Acceptance: no other existing prop or the modal's three close paths (button/backdrop/Esc) change behavior.

### Nice-to-Have (P1)

None. Matches this repo's existing pattern (see `ptcg-card-zoom-spec.md`) of shipping a tight P0-only v1.

### Future Considerations (P2)

- A full language name on hover/tap (e.g. tooltip "Japanese" instead of just "JA") if the two-letter code proves unclear to visitors in practice.
- Displaying `isLocked`'s reason inline near the lock icon (currently `remarks` already covers "why" if Skyler chooses to write one, so this may never be needed).

## Open Questions

- None blocking. Verified against the upstream spec that `isLocked`/`remarks` are structurally impossible on non-Pokédex/Unown binders today (always publish defaults), so no extra guard code is needed to prevent them appearing elsewhere — the UI's `!== "EN"` / `isLocked === true` / non-empty checks are sufficient on their own.

## Timeline Considerations

- No hard deadline.
- Purely additive — no dependency on other in-flight work on this repo. Depends on `PokedexBinderV2` commit `7921b82` already being live in production `binder.json`, which it is.
- Single-pass P0 build only.
