# Projects Page — Spec (Tools → Projects repurpose)

Status: **Approved 2026-07-12** (scoped directly with Skyler this session)
Date: 2026-07-12
Owner: Skyler (Tan Jia Hong / SkylerMayday)
Code repo: `D:\Claude Projects\skylermayday-site`

---

## Problem Statement

The `/tools` page undersells what it actually is: a portfolio of things Skyler has built and runs. It lists two items (Stream Analyser, Discord bot status) while the site's biggest build — the PTCG binder showcase — sits outside it, and real projects (Packs of Noods, MobileStream, Games Expedition) have no presence at all. A visitor can't see the breadth of what Skyler makes; "Tools" frames him as a utility author rather than a creator with a body of work.

## Goals

1. One page (`/projects`) where a visitor sees everything Skyler makes — current and past — within one scroll.
2. Each project is honestly labeled by what kind of project it is (Stream Content vs Vibe Coded) via small icon badges.
3. The two existing tool pages move under `/projects/*` without breaking a single previously shared URL.
4. Packs of Noods gets a real public page with the full location log — genuinely fun, updatable content.

## Non-Goals

- **No changes to the Stream Analyser or binder page internals** — this is a re-routing + landing-page feature. The binder bookshelf, stream-analyser flow, and their APIs are untouched.
- **No moving API routes** — `/api/stream-analyser/*` paths stay exactly where they are (not user-facing; moving them adds churn and risk for zero benefit).
- **No AI-generated image assets for badges** — badges are inline SVG icons, consistent with the site's zero-external-dependency pattern.
- **No project detail pages beyond Packs of Noods** — MobileStream and the Discord bot are cards only (neither has a public URL to link to). Detail pages are a future consideration if wanted.
- **No new data write paths** — PoN location log follows the shop-listings pattern exactly (flat JSON, git-edited, zod-validated, redeploy on push).

## Page Structure — `/projects`

Title: **Projects**. Two segments in order:

### Current Projects

| Project | Badge(s) | Card links to | Copy direction |
|---|---|---|---|
| **Packs of Noods** | Stream Content | `/projects/packs-of-noods` | Food IRL stream series with draftpicked — exploring Singapore noodle spots + opening Pokémon TCG packs. #teamfatnoods. Do **not** describe it as udon-specific (brand has moved past "udon vibes"). |
| **Pokédex Binder** | Stream Content + Vibe Coded | `/projects/ptcg-binders` | Android app + this site's binder showcase tracking the living-Pokédex TCG collection, plus personal collection binders. Mention "and personal collection" per Skyler's ask. |
| **Stream Analyser** | Vibe Coded | `/projects/stream-analyser` | Keep current copy: analyse a VOD's chat, audio, and stream quality. |
| **Discord Bot** | Vibe Coded | no link (card) | Keep the existing live online/offline status widget exactly as-is (Server Widget API, graceful degrade). |
| **MobileStream** | Vibe Coded | no link (card) | Android app that streams phone camera/screen via RTMP and auto-drives OBS scene switching for IRL streams — replaces NOALBS. |

### Past Projects

| Project | Badge(s) | Links to | Copy direction |
|---|---|---|---|
| **Games Expedition** | Stream Content | `https://www.youtube.com/@GamesExpedition` (external, new tab) | Game-showcase channel exploring what makes games worth playing — ran Nov 2019 – Nov 2024, 72 archived episodes across three shows (Main Show, Space'd Out, Uncharted), made with NeppyNepstar, FinalPhantasia, MooseyMus and crew. Started on Mixer, moved to Twitch, archived on YouTube. |

Past-project cards should read visually "archived" relative to current ones (e.g. muted treatment), but stay fully legible and clickable.

## Badges ("Stream Content" / "Vibe Coded")

- Small inline pill: icon + label text. Icon is inline SVG (suggestions: broadcast/signal or camera glyph for Stream Content; code-brackets/sparkle glyph for Vibe Coded). No external assets, no image generation.
- Must work in light + dark mode, have accessible text (the label IS visible text, not tooltip-only), and not wrap awkwardly at 375px.
- A project can carry both badges (Pokédex Binder does).

## Route Changes (P0 — zero broken URLs)

| Old route | New route |
|---|---|
| `/tools` | `/projects` |
| `/tools/stream-analyser` | `/projects/stream-analyser` |
| `/ptcg-binders` | `/projects/ptcg-binders` |
| `/ptcg-binders/[binderSlug]/[sectionSlug]` | `/projects/ptcg-binders/[binderSlug]/[sectionSlug]` |

- **Permanent (301/308) redirects** from every old path to its new equivalent, including the dynamic binder section paths — the original site spec promised "per-binder URLs are stable and shareable"; redirects are what keep that promise through the rename. Use `next.config.ts` `redirects()` with a `:path*` pattern where applicable.
- All internal references update to the new paths: `NavLinks.ts`, home `QuickLinks`, any `<Link>`s inside binder components (e.g. `BinderSectionSpine`), breadcrumbs/back-links inside the binder section pages, `lib/slug.ts` if it builds paths, page `metadata` titles, sitemap/robots if present.
- Nav after the change: `Home, About, Content, Projects, PTCG Binders, Contact` — **PTCG Binders keeps its top-level item**, href updated to `/projects/ptcg-binders`. "Tools" label becomes "Projects" (`/projects`). Shop stays hidden (unchanged).

## New Page — `/projects/packs-of-noods` (P0)

Decided with Skyler: **intro + stats + full location log**, data in a **flat JSON file** (`data/pon-locations.json`), zod-validated at build like `shop-listings.json` (malformed data fails the build loudly).

1. **Intro** — what the series is: monthly-ish food IRL stream with draftpicked; Singapore food spots (noodles a recurring theme, not the definition) + Pokémon TCG pack openings at the table; #teamfatnoods. Runs since Dec 2022.
2. **Stats row** — computed from the JSON at render time, not hardcoded: total visits, distinct locations, date range, most-visited cuisine. (Numbers must not go stale when the JSON grows.)
3. **Location log table** — columns: Date, Name, Location, Content, Guests, Notes. Seed from the vault log (`Digital Brain/wiki/projects/live-streaming/concepts/packs-of-noods/pon-stream-logs.md`, 47 entries Dec 2022 – Jun 2026; two "unknown" entries may be omitted from the public page). Closure legends (PC/TC/OOA) either expanded to words or given a small legend line — don't ship bare abbreviations.
4. Mobile: the table must not cause horizontal page scroll at 375px — wrap it in its own scroll container or stack it as cards.

## Requirements Summary

### Must-Have (P0)
1. `/projects` page with Current/Past segments and all 6 projects as specced above. AC: renders both segments, badges visible, Discord bot status widget still works, Games Expedition links out to the YouTube channel.
2. Route moves + permanent redirects, zero broken URLs. AC: hitting each old URL (including a real deep binder-section URL) 30x-redirects to the new path which renders correctly; nav and all internal links point at new paths with no redirect hop.
3. `/projects/packs-of-noods` page per above. AC: builds fail on malformed JSON; stats derive from the data; table readable at 375px with no page-level horizontal scroll.
4. Badge component with the two variants. AC: legible both themes, accessible label, reusable (used across current + past cards).

### Nice-to-Have (P1)
- Segment anchor links (`/projects#past`) for direct sharing.
- Per-cuisine or per-content filter on the PoN log table (client-side, trivial).

### Future Considerations (P2)
- Detail pages for MobileStream / Discord bot if they ever get public surfaces.
- PoN "potential places" wishlist section (vault page exists but is currently empty).
- Auto-sync of the PoN log from the vault (currently manual JSON edit — fine at ~1 entry/month).

## Open Questions

None blocking — all scoping questions were answered by Skyler 2026-07-12 (full log on the page; binders keep top-level nav; flat JSON data file).

## Verification Notes

- Redirect matrix is the highest-risk item — test every row of the route table, plus one real section deep-link (e.g. `/ptcg-binders/pokedex/generation-i`).
- The binder pages fetch external data server-side; local dev on this machine can't fetch external data (known TLS-intercept issue) — verify against production or accept static verification for the binder deep-link render, per prior sessions' precedent.
- OG/metadata titles for the new/renamed pages.
