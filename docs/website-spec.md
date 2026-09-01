# SkylerMayday.com — Website Spec

Status: **Approved 2026-07-08** — Phase 1 build cleared to start
Date: 2026-07-07 (approved 2026-07-08)
Owner: Skyler (Tan Jia Hong / SkylerMayday)

---

## Problem Statement

Skyler has bought the domain **SkylerMayday.com** but has no central home for his brand. Right now his presence is scattered: Twitch (primary), TikTok, Instagram, YouTube, X, a Doras.to link-in-bio, plus two standalone tools he's built (**StreamAnalyser**, a Twitch VOD/channel analysis app on Railway; **Pokédex Binder**, an Android app with a public static web viewer for his Pokémon TCG collection). There's no single URL that ties "who I am / what I make / what I'm selling / what I've built" together, and no owned surface to point new viewers, card buyers, or fellow streamers to. Cost of not solving it: every platform link-in-bio is a rented surface, and two working tools he built have no discoverable front door.

## Goals

1. Give SkylerMayday.com a home page that a new visitor can land on and understand who he is and what he does within one scroll (brand + top content).
2. Surface his best Twitch/YouTube content automatically, without manual upkeep, so the site doesn't go stale between visits.
3. Let Pokémon TCG buyers see what's currently for sale and know how to reach him to buy — replacing ad-hoc Discord/Instagram DMs as the discovery point.
4. Give **StreamAnalyser** (public/lite mode) and **Pokédex Binder** a proper discoverable home instead of loose Railway/GitHub Pages URLs.
5. Ship on a stack with **no new recurring cost** — reuses existing Railway account/patterns where sensible, consistent with stated budget constraints ([[PokedexBinder]] hosting decision precedent).

## Non-Goals

- **No real e-commerce checkout in v1.** Card sales are a showcase/listing only — buyers contact Skyler directly to arrange payment. No cart, no payment processor, no inventory-sync logic. *(Confirmed by Skyler — avoids PCI/payment complexity and ongoing inventory management for what's currently a casual side-sell.)*
- **No full StreamAnalyser dashboard on the public site.** The public site only surfaces a **lighter, login-free version** of Stream Analysis. *(Full dashboard requires Twitch OAuth and channel ownership — not appropriate for public visitors.)* **Decided 2026-07-07:** the standalone Railway app will be **retired** once the lite version ships as a page of this site — StreamAnalyser collapses into the website rather than living on as a separate product. Whether any of the authenticated Dashboard features survive (and where) is decided in the lite-mode spec (P2).
- **No blog/CMS in v1.** No article system, no comments. If a "Content" section is wanted for text posts later, that's a separate future spec. *(Not requested; auto-pulled video content covers the stated need.)*
- **No TikTok auto-pull.** TikTok has no public API for "list a user's top videos" without business/developer approval — see Open Questions. v1 uses manual embeds for TikTok only. *(Technical constraint, not a scope choice.)*
- **No accounts/login for site visitors.** The site is a public showcase; nothing on it (besides the pre-existing tools it links to) requires visitor sign-in. *(Keeps the site static-leaning and simple.)*

## User Stories

**New visitor (fan, discovered via a clip or search)**
- As a new visitor, I want to see who Skyler is and what kind of content he makes within seconds of landing, so I decide whether to follow.
- As a new visitor, I want to see his best/most recent Twitch and YouTube content without leaving the site, so I get a real sense of his content before committing to a platform.
- As a new visitor, I want one page of links to all his platforms (Twitch, TikTok, Instagram, YouTube, X, Discord), so I can follow him wherever I actually use.

**Potential card buyer**
- As a potential buyer, I want to browse what Pokémon cards are currently for sale (with photos, set/name, price, and availability status), so I can decide what I want.
- As a potential buyer, I want a clear "how to buy" path (contact form or DM link), so I know exactly how to reach Skyler and don't have to guess.
- As a potential buyer, I want to see when a listing is already sold, so I don't waste time asking about something unavailable.

**Fellow streamer / tool user**
- As a visitor interested in stream analytics, I want to try a lite version of Stream Analyser without logging in, so I can evaluate it before deciding to invest more.
- As a visitor curious about Skyler's Pokémon TCG collection, I want to browse his binders as a bookcase at `/ptcg-binders` and open any single binder at its own URL, so I can see collection progress and share a specific binder directly.

**Skyler (site owner)**
- As the owner, I want to update the "for sale" card list without touching code (a simple data file or lightweight admin form), so listing changes don't require a dev session each time.
- As the owner, I want the content feed to pull automatically from Twitch/YouTube APIs, so I never have to manually re-embed clips.
- As the owner, I want the `/ptcg-binders` pages to update automatically from my existing Android-app Publish button, so putting the collection on my own domain adds zero new upkeep steps.

## Site Map / Pages

| Page | Route | Purpose |
|---|---|---|
| Home | `/` | Hero (brand, current status/schedule), top-content teaser (2-3 pulled items), quick links to Shop / Tools / Contact |
| About | `/about` | Who he is, brand story, platform table, streaming schedule |
| Content / Highlights | `/content` | Full auto-pulled feed: top Twitch clips/VODs, top YouTube videos, filterable by platform; manually curated TikTok picks section |
| Shop (Pokémon Cards) | `/shop` | Card showcase grid (photo, name/set, price, status: available/sold), sort/filter by set or status |
| Tools | `/tools` | Landing page linking to the two sub-tools below |
| — Stream Analyser | `/tools/stream-analyser` | Lite/public Stream Analysis (no login), built as a native page of this site (v1: link to existing Railway app until lite mode ships; then Railway app retires) |
| PTCG Binders | `/ptcg-binders` | Bookcase view of all public binders, built as a native page of this site fetching the published `binder.json`/`changelog.json` from the existing GitHub repo |
| — Single binder | `/ptcg-binders/[binder-slug]` | One binder's full view (completion bars, changelog, card grid) — e.g. `/ptcg-binders/pokedex`; slugs map to entries in the publish schema's `binders` array |
| Contact | `/contact` | Contact form + all platform links + Discord invite (if applicable) |
| 404 | (any unmatched route) | Friendly not-found page, links back to Home |

## Requirements

### Must-Have (P0)

1. **Home page** with hero section reflecting brand vibe (cozy + hype, SG-based, variety + TCG + food + builds) and a top-content teaser.
   - Acceptance: loads in under 2s on a standard connection; hero + at least 2 teaser content items render without JS errors; mobile-responsive at 375px width.
2. **Auto-pulled Twitch content** on `/content` (and Home teaser) via Twitch Helix API (top clips and/or recent VODs), server-side key handling (mirrors StreamAnalyser's server-side `ANTHROPIC_API_KEY` pattern — no client-exposed secrets).
   - Acceptance: given the Twitch API returns clip/VOD data, the page renders thumbnails, titles, and view counts without exposing any API credentials in client-side network requests.
3. **Auto-pulled YouTube content** on `/content` via YouTube Data API v3 (public API key, read-only, no OAuth needed for public channel data).
   - Acceptance: latest/top videos render with thumbnail, title, and view count; broken/missing thumbnail falls back to a placeholder image, not a broken image icon.
4. **Pokémon card showcase (`/shop`)** listing cards with photo, name, set, price, and status (available/sold), updatable by Skyler without a full redeploy cycle taking more than a few minutes.
   - Acceptance: sold items are visually distinct (e.g., "SOLD" badge, greyed out) and are not orderable/clickable-to-buy; each listing links to a contact method.
5. **Contact path** — a working contact form reachable from Shop listings and the Contact page, delivering submissions by **email**, plus a **Discord webhook** notification so Skyler sees new submissions in his server without checking email.
   - Acceptance: submitting the contact form delivers the message to an email inbox Skyler checks AND fires a Discord webhook alert; form validates required fields before submit.
6. **PTCG Binders section (`/ptcg-binders`)** — bookcase view of all public binders plus per-binder pages (`/ptcg-binders/[binder-slug]`), rendering the same data the Android app already publishes (completion bars, changelog/recent updates, card grid), fetched from the `SkylerMayday/binders-pokedex-binder` GitHub repo.
   - Acceptance: after Skyler taps Publish in the Android app, the site reflects the new data within one cache window (no app-side changes required); a binder present in the publish schema but toggled non-public never appears; per-binder URLs are stable and shareable; mobile rendering is at least as usable as the current GitHub Pages viewer.
7. **Tools landing page (`/tools`)** linking to Stream Analyser (lite/public mode).
   - Acceptance: Stream Analyser link works (v1: link-out to the existing Railway app; post-lite-mode: native page, no Twitch login required).
8. **Mobile-responsive across all pages** (this is a link-in-bio replacement — most traffic will be mobile from Twitch/TikTok/Instagram bios).
   - Acceptance: no horizontal scroll, no overlapping text/images, at 375px and 768px viewport widths on every page above.
9. **No secrets or API keys ever exposed client-side** — every third-party API call with a credential goes through a server-side route, matching the pattern already proven in StreamAnalyser (`POST /api/claude` relay, server-side `ANTHROPIC_API_KEY`).
   - Acceptance: browser devtools Network tab shows no API keys/tokens in any request initiated from the site.

### Nice-to-Have (P1)

- Rate-limit the server-side content-pull endpoints (mirrors StreamAnalyser's 10 calls/IP/hr in-memory limiter) to avoid burning Twitch/YouTube API quota from repeat visitors.
- Cache pulled content server-side for a short TTL (e.g., 15-30 min) so the same Twitch/YouTube calls aren't re-fired on every page load.
- Lightweight Discord webhook notification when a contact form is submitted (mirrors the Discord embed pattern already built for Pokédex Binder publishes).
- Simple admin-only edit path for the Shop listings (e.g., a JSON/markdown file in the repo that Skyler edits directly, or a tiny password-gated form) rather than needing a code change per listing update.
- Current/next stream schedule widget on Home (pulled from Twitch API `channels/schedule`).

### Future Considerations (P2)

- **Lite/public StreamAnalyser respec** — confirmed direction (2026-07-07): a login-free lighter version of Stream Analysis will be built as a page of this site, and the **standalone Railway app retires** once it ships. Still a **separate spec**, not folded into this one, because it involves real product decisions (what's shown without auth, how to avoid quota abuse from anonymous public use, whether results are for any channel or just Skyler's, what happens to the authenticated Dashboard features). Recommend running `write-spec` on it once this site's v1 ships.
- Full multi-binder support on the Pokédex Binder link (Connecting Art, Personal Collection binders) once that Android-side feature ships.
- Blog/text-content section if Skyler later wants long-form posts.
- TikTok auto-pull, if/when TikTok opens broader public API access, or if Skyler pursues TikTok for Developers business approval.
- Community/Discord hub integration if [[Skyler's Lounge]] (planned Discord successor to TAIOH!) launches and needs a site presence.

## Technical Recommendation

Given: nothing built yet, budget-conscious (explicit no-new-recurring-cost preference, same reasoning that picked GitHub Pages for the Pokédex Binder viewer), an existing proven pattern for server-side API-key handling (StreamAnalyser's Express relay), and a need for server-side routes (content pull, contact form) that a pure static site can't do safely.

**Recommendation: Next.js, deployed on Vercel's free Hobby tier.**
- Next.js API routes handle the Twitch/YouTube server-side calls (keys in Vercel environment variables, never shipped to the client) — same security pattern as StreamAnalyser's proxy, different host.
- Vercel Hobby tier is $0 for this traffic profile (personal site, no enterprise SLA needed) — avoids adding a second paid Railway service or pushing the existing Railway Hobby credit further.
- Static/ISR (Incremental Static Regeneration) rendering for Home/About/Shop keeps pages fast; API routes only run for the dynamic content-pull and contact-form endpoints.
- Alternative considered: adding this as a second service under the existing Railway project (same account as StreamAnalyser). Rejected as default because Railway's Hobby plan is a shared $5/mo usage credit across services — a second always-on Node service risks eating into that budget faster than Vercel's free static+serverless model for a mostly-static site. Worth revisiting if Skyler prefers one platform to manage instead of two.

**Domain/DNS architecture (decided 2026-07-07, revised same day):**
- `skylermayday.com` (apex + `www`) → the new site on Vercel. That is the **only** DNS record set needed — no subdomains at all.
- **PTCG binders live at `skylermayday.com/ptcg-binders` as a native page of this site** (Skyler's preference — the UI is a bookcase of binders, with one URL per binder underneath, e.g. `/ptcg-binders/pokedex`). The site fetches the published `binder.json`/`changelog.json` directly from the existing `SkylerMayday/binders-pokedex-binder` GitHub repo (server-side or ISR fetch — no CORS concerns, no Android app changes, publish pipeline completely untouched). The current GitHub Pages viewer keeps working during the transition and can be retired (or left as a fallback) once `/ptcg-binders` is live. The multi-binder publish schema already supports this via its `binders` array.
- StreamAnalyser gets **no subdomain**: the lite version will be built as a native page of this site (`/tools/stream-analyser`), and the standalone Railway app retires when it ships. Until then, the page links out to the existing Railway URL.
- *(Rejected alternative for the binders: a Vercel rewrite proxying `/ptcg-binders/*` to GitHub Pages — zero-code but the viewer would look like a different product stitched into the site; porting the viewer natively costs little since it's plain HTML/CSS/JS with no build step, and yields a unified design.)*

## Success Metrics

*(Personal/hobby site — metrics are directional, not growth-team KPIs.)*

**Leading indicators**
- Site loads correctly on mobile and desktop with zero console errors — checked at launch and after each deploy.
- At least 1 real contact-form or DM inquiry about a Shop listing within the first 30 days of `/shop` going live.
- Content feed shows genuinely current (not stale/cached-forever) Twitch/YouTube items — spot-checked weekly for the first month.

**Lagging indicators**
- SkylerMayday.com becomes the link Skyler actually puts in his Twitch bio/Doras.to/social bios in place of (or alongside) scattered platform links, within 60 days of launch.
- Reduction in "how do I buy this card" DMs that start from confusion (i.e., buyers arrive already knowing price/availability from the Shop page).

## Open Questions

- **StreamAnalyser lite-mode scope** *(Skyler — non-blocking, feeds the P2 item)*: what exactly should the login-free version show — is it "analyze any public channel's latest VOD" or "just showcase Skyler's own stats read-only"? This determines whether public rate-limiting is a real abuse concern (any channel = higher quota risk) — should be resolved when that separate spec is written. **In progress as of 2026-07-08.**

### Resolved (2026-07-07)

- **Domain/subdomain architecture** → decided: apex + `www` to the new site on Vercel, the only DNS record needed. No subdomains at all — PTCG binders live at `skylermayday.com/ptcg-binders` as a native page (not `binder.skylermayday.com`); StreamAnalyser gets no subdomain either since its lite version becomes a native page of this site and the Railway app retires.
- **Twitch API app/credentials** → decided: **reuse** the existing StreamAnalyser Twitch Developer app/Client ID. Rate-limit isolation doesn't matter since StreamAnalyser is being absorbed into this site rather than living alongside it.

### Resolved (2026-07-08)

- **Contact form delivery** → **email**. The contact form's actual message delivery is by email, not a Discord webhook.
- **Site notifications (separate from contact-form delivery)** → any notification the site sends to Skyler or his Discord server (e.g. a "new contact form submitted" alert, future admin-facing pings) uses a **Discord webhook**, consistent with the existing Pokédex Binder publish pattern. So a contact form submission delivers the message by email *and* can fire a Discord webhook alert that a submission came in.
- **Shop listing update mechanism** → **flat JSON file edited via git** (e.g. `shop-listings.json` in the repo). Editing and pushing (including via GitHub web/mobile) triggers a Vercel redeploy. No new admin auth surface or backend needed for v1.

## Timeline Considerations

- No hard deadline — Skyler stated time is not a constraint.
- **Dependency**: the binder publish data is already live in the `SkylerMayday/binders-pokedex-binder` repo, so `/ptcg-binders` has no external blockers — it re-renders existing published JSON. The multi-binder Android feature (Connecting Art, Personal Collection) isn't built yet, so the bookcase launches with one binder (Pokédex) and grows automatically as the app publishes more; the bookcase UI should be designed for N binders from day one.
- **Suggested phasing**:
  1. Phase 1 (v1 launch): Home, About, Content (Twitch + YouTube auto-pull, TikTok manual), Shop (showcase only), PTCG Binders (bookcase + per-binder pages, native), Tools landing with a link-out to the existing StreamAnalyser Railway app, Contact.
  2. Phase 2: P1 items (caching, rate-limiting, schedule widget, Discord contact notifications); optionally retire the GitHub Pages viewer once `/ptcg-binders` is confirmed solid.
  3. Phase 3 (separate spec): StreamAnalyser lite/public mode built as a native page; Railway app retires.
