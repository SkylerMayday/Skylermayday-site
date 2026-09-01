# Stream Analyser Port — Spec

**Status:** Approved scope, ready for `dev-team-pipeline`
**Owner:** Skyler
**Date:** 2026-07-10

## Problem Statement

StreamAnalyser (VOD Desk) is a working, useful tool — but it lives on a separate Railway deployment (`skylerstreamanalyser`), requires Twitch OAuth login to unlock most features, and asks users to install ffmpeg locally for the upload-your-own-recording fallback. This fragments Skyler's web presence (a second domain/app to maintain) and gates the tool's actual value (VOD analysis, clip detection, AI feedback) behind friction most casual visitors won't push through. Skyler doesn't expect frequent repeat visits — people come to run one analysis, not to build a habit — so a login-free, install-free, single-page flow matches actual usage better than the current multi-tab, auth-gated app.

## Goals

1. `/tools/stream-analyser` on skylermayday.com replaces the current "opens in a new tab" Tools card with a fully native page — no separate domain, no login screen.
2. Every feature that doesn't require login or a local install survives the port with equivalent behavior (verified against the current app's function map, not re-derived from scratch).
3. Audio-energy clip detection (echo, loudness, dead air) ships in v1 — confirmed feasible via a live spike against Vercel's serverless constraints, and simpler to implement than the current Railway version because Twitch's VOD delivery format changed since the original code was written (see Architecture).
4. The Railway app (`skylerstreamanalyser`) is retired once this page is live and verified working.

## Non-Goals

- **Stream History** (own/any-channel saved analyses) — explicitly cut by Skyler; not folded into anything else.
- **Pre-Stream Checklist** — explicitly cut by Skyler.
- **Subs/bits Dashboard cards** — inherently require a broadcaster OAuth token; no public-data equivalent exists. Cut.
- **Upload-your-own-recording fallback** — existed specifically to route around login-gated audio; moot once audio is public. The ffmpeg-install instructions that came with it are cut outright regardless.
- **Live stream analysis** (as opposed to VOD/archive analysis) — out of scope; the current app is VOD-only and this port doesn't expand scope.
- **Any UI polish/redesign pass** — this spec ports functionality onto skylermayday.com's existing design system as-is (cards, tokens, dark mode already established sitewide). A `design-team-pipeline` pass can follow later if Skyler wants the page to look distinct; not blocking this build.
- **IndexedDB / history migration, head-to-head comparison, shareable report export** — already in StreamAnalyser's own backlog as "KIV, do not implement until asked." Still true here.

## Scope: What Ports, What Doesn't

Derived from `StreamAnalyser/project-overview.md`'s function map, cross-checked against the "no login, no install" rule Skyler gave this session.

| Feature | Current gate | Ports? | Notes |
|---|---|---|---|
| VOD search by username → analysis | Public GQL, no auth | ✅ | Already works logged-out today |
| Title rating | none | ✅ | Rule-based + AI-assisted |
| Benchmark stats | none | ✅ | |
| AI feedback / improvement notes / AI metrics card | Claude relay, server-side key | ✅ | Reuse Claude relay pattern |
| Chat-Spike Studio tab | Public GQL | ✅ | |
| Audio-Peak Studio tab (echo/loudness/dead-air) | Was login-gated (audio proxy config lived in Settings) | ✅ | New architecture, see below — no login needed, ever |
| Bitrate card | HLS master playlist, no auth | ✅ | |
| Clip count | Helix, needs app token | ✅ | App-access-token relay (client-credentials), not user login |
| Channel Overview: followers, schedule, description analysis, discoverability audit, community protection | App-token relay | ✅ | Subs/bits fields removed |
| Subs/bits cards | Broadcaster OAuth token | ❌ | No public equivalent — cut |
| Upload local recording + ffmpeg instructions | Local install | ❌ | Cut |
| Settings tab | Already hidden/dead | ❌ | Drop the DOM shell for real this time (not needed — see Sharp Edges below on why the old app kept it) |
| Stream History | Own-channel gate → any-channel-but-still-login-adjacent | ❌ | Explicitly cut by Skyler |
| Pre-Stream Checklist | AI checklist synthesis | ❌ | Explicitly cut by Skyler |
| Twitch OAuth / sign-in flow | — | ❌ | Removed entirely; `vodDeskCreds` localStorage model gone |

## Layout

**Single flow, not tabbed.** One username-search box at the top of the page. Submitting it renders, in order, on one scrollable page:

1. Channel Overview strip (avatar, followers, schedule, description analysis, discoverability audit, community protection)
2. VOD picker (recent VODs for that channel) → selecting one runs the analysis
3. Analysis results: title rating → benchmark → bitrate card → clip count → AI feedback/metrics
4. Studio: Chat-Spike clips and Audio-Peak clips, side by side or stacked (implementation detail for the Coder stage, not load-bearing)

The old app's Dashboard-tab vs Stream-Analysis-tab split existed only to separate "your logged-in channel" from "a VOD you're analyzing." That distinction is gone — there's no login, so it's always "a channel you searched for." Collapsing to one flow removes dead navigation, not functionality.

## Architecture

### Page & component structure (Next.js App Router)

```
app/tools/stream-analyser/
  page.tsx                     — server component shell, metadata
  components/
    ChannelSearch.tsx           — username input, client component
    ChannelOverview.tsx         — followers/schedule/description/discoverability/community cards
    VodPicker.tsx                — recent VODs list for the searched channel
    AnalysisResults.tsx          — title rating, benchmark, bitrate, clip count, AI feedback/metrics
    StudioClips.tsx              — Chat-Spike + Audio-Peak clip lists
lib/
  stream-analyser/
    twitch-gql.ts                — public GQL calls (playback token, chat comments, VOD list) — client-callable, no server hop needed (same public client ID pattern the old app used directly from the browser)
    twitch-helix.ts              — extends existing lib/twitch.ts app-token pattern for channel overview + clip count fields not already covered (followers, schedule, description, discoverability signals)
    audio-clip-detection.ts      — client-side RMS windowing, echo autocorrelation, loudness/clipping stats — ported from public/lib/audio-probe.js almost unchanged (this logic doesn't touch the network format at all)
    chat-clip-detection.ts       — chat-spike scoring — ported from index.html's scoreClips/dedupClips logic
    title-rating.ts              — ported from runTitleRating
app/api/
  stream-analyser/
    audio-proxy/route.ts         — the new, simpler audio fetch: given a segment URL + its init-segment URL, fetch both server-side (CORS bypass), concatenate, stream back. No demuxing.
    playlist-proxy/route.ts      — fetch HLS master/media playlists server-side (same CORS-bypass need as /proxy in the old app; these are plain text, no binary handling)
    claude/route.ts              — Claude relay, same pattern as the old app's /api/claude — reuse ANTHROPIC_API_KEY env var already on Vercel if configured for the site, else add it
```

### Audio pipeline (the part that changed this session)

**Old (Railway) approach — do not port:** `demuxTStoADTS()` in `proxy.js` byte-parses MPEG-TS packets (PAT/PMT/PES parsing) to extract raw AAC frames. **Verified broken today** against a real live VOD (2026-07-10 spike) — Twitch no longer serves VOD segments as MPEG-TS.

**New approach (verified working via live spike, 2026-07-10):**
1. Client (or a thin server route) parses the HLS media playlist same as before — finds `#EXT-X-MAP:URI="init-0.mp4"` (the init segment) and the numbered fragment URIs (`0.mp4`, `1.mp4`, ...).
2. `app/api/stream-analyser/audio-proxy/route.ts` receives `?init=<url>&seg=<url>`, validates both are twitch/cloudfront-domain-allowlisted (same allowlist as the old `ALLOWED_DOMAINS`), fetches both concurrently server-side (CORS is blocked client-side — verified `access-control-allow-origin: null` on Twitch's CDN), concatenates `init + fragment` bytes, and **streams** the combined buffer back with `Content-Type: video/mp4`.
3. Client passes the combined bytes straight to `AudioContext.decodeAudioData()` — verified via `ffprobe` that `init-0.mp4 + 0.mp4` concatenation produces valid AAC(48kHz stereo)+H264 that decodes. No mux.js transmux fallback needed (that existed only for the TS case).
4. Sample 15 segments at the lowest-bandwidth variant (as today), same RMS-energy/echo/loudness analysis code, unchanged — it operates on decoded `AudioBuffer` data regardless of how it got there.

**Why streaming, not a buffered response:** the lowest-bandwidth variant's segments (~656KB/10s, verified) fit well under Vercel's 4.5MB non-streaming cap today, but a higher-bitrate variant or a future Twitch encoding change could exceed it. Streaming sidesteps the cap entirely and costs nothing extra to implement in a Next.js Route Handler.

**Verified Vercel fit:** Hobby plan, Fluid compute — 300s default/max duration, 2GB memory, 1,024 file descriptors. A 15-segment probe fetching two small files each (init cached after first fetch, or refetched — negligible either way at 1.1KB) is a few seconds of total network time. No batching/rate-limiting workaround needed like the old Railway app's `BATCH=5 + 200ms delay` (that was Railway's own connection-pool constraint, not inherent to the fetch pattern).

### Rate limiting & security conventions to reuse (not reinvent)

- **Claude relay:** reuse `lib/rate-limit.ts` exactly as the contact route does (`checkRateLimit(ip)`, 10/hr default — tune limit if needed for this route, same fixed-window in-memory pattern). This also **fixes** StreamAnalyser gap #3 (the old Railway rate limiter trusted the first `x-forwarded-for` entry, which is spoofable on Railway; the website's existing `getClientIp()` helper already documents why trusting the first entry is *correct* specifically on Vercel — port that helper, don't re-derive the trust model).
- **Audio-proxy and playlist-proxy routes:** currently *unrated-limited* in the old app (gap #4, flagged as the main bandwidth exposure once fully public). Apply `checkRateLimit` here too — this is a new hardening step relative to the old app, not a regression.
- **Domain allowlist:** port `ALLOWED_DOMAINS` from `proxy.js` verbatim (`usher.ttvnw.net`, `gql.twitch.tv`, `.ttvnw.net`, `.cloudfront.net`, `.hls.ttvnw.net`) into the new proxy routes.
- **CSP:** extend the site's existing scoped CSP (`next.config.ts`) to allow the Twitch/CloudFront origins already used by clip/VOD thumbnails, plus whatever new fetch targets these routes introduce. Do not adopt the old app's blanket `'unsafe-eval'` — that existed for mux.js transmuxing, which the new audio pipeline doesn't need.
- **Env vars:** `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET` already exist on the site (`lib/twitch.ts`) — reuse, don't duplicate. Confirm `ANTHROPIC_API_KEY` is set on the Vercel project (StreamAnalyser has its own; the site may or may not already have one for another feature — check before assuming).

### Public GQL calls — client-side or server-side?

The old app calls `gql.twitch.tv` directly from the browser (no proxy) for chat comments, VOD lists, and the playback access token — these are plain JSON POST requests with a public client ID and (per the live spike this session) work fine without CORS issues from Node; from a browser they've always worked directly in the old app too. **Keep these client-side**, same as today — only the binary HLS segment/init fetches need a server hop, because those are the ones CORS-blocked.

## Migration / Cutover Plan

1. Build `/tools/stream-analyser` fully, test against real channels/VODs (including Skyler's own, per this session's spike VOD).
2. Update `app/tools/page.tsx`: replace the "opens in a new tab" card with a direct link to `/tools/stream-analyser` (or inline a compact entry point — Coder's call, not load-bearing).
3. Remove `env.STREAM_ANALYSER_URL` usage once the native page is confirmed working (currently gates the old Tools card's "coming soon" fallback).
4. Once Skyler confirms the native page is solid: shut down the Railway service (`skylerstreamanalyser`), archive its repo (don't delete — matches the pattern of PokedexBinderV2's old viewer being kept in maintenance-only mode rather than deleted).
5. Update the Digital Brain wiki page `lifestyle/tech/ai/claude/claude-projects/stream-analyser.md` to reflect the new architecture (deferred until code actually ships, per StreamAnalyser's existing handoff note).

## Open Questions

- **[Engineering, non-blocking]** Exact Channel Overview field set for "discoverability audit" and "community protection" — these were AI-assisted analyses of public profile data in the old app (`loadChannelOverview`/`runDiscoverabilityAudit`). Port the same prompts/logic; flag during implementation if any input field they depended on turns out to be login-gated in Helix (unlikely — verify against Helix's public scopes during Coder stage).
- **[Skyler, non-blocking]** Whether Chat-Spike and Audio-Peak studio clips render as two side-by-side lists or a merged/tabbed view within the Studio section — cosmetic, left to the Coder/Design pass.
- **[Skyler, non-blocking]** Whether to keep the "VOD Desk" branding/name anywhere on the new page, or drop it in favor of "Stream Analyser" throughout (matches the Tools card label already on the site).

## Acceptance Criteria

- [ ] Visiting `/tools/stream-analyser` requires no login and no local install for any visible feature.
- [ ] Searching a public Twitch username surfaces their recent VODs; selecting one runs full analysis (title rating, benchmark, bitrate, clip count, AI feedback/metrics, chat-spike clips, audio-peak clips).
- [ ] Audio-peak clip detection works end-to-end against a real live VOD (not just the spike's manual test) — echo/loudness/dead-air results render.
- [ ] Channel Overview renders followers/schedule/description-analysis/discoverability/community-protection with no subs/bits fields present anywhere in the UI or API responses.
- [ ] No `vodDeskCreds`/localStorage auth artifact remains anywhere in the shipped code.
- [ ] `/tools` page's Stream Analyser card links to the native page, not an external Railway URL.
- [ ] Claude relay and audio/playlist proxy routes are rate-limited using the site's existing `lib/rate-limit.ts` pattern.
- [ ] CSP updated and verified (no console CSP violations on a fresh load + full analysis run).
- [ ] Dark mode verified (screenshot, per this project's established verification standard).
