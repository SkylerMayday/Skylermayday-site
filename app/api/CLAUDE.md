# app/api — Claude Code Instructions

Next.js route handlers. **Five routes, and every one of them follows the same three rules.** Breaking any of them in a new route is the failure mode this file exists to prevent.

## Non-negotiables for any route added here

1. **Rate-limit it.** All 5 existing routes import from `lib/rate-limit.ts`. A new route without rate limiting is the odd one out, not the norm.
2. **Never echo secrets back to the client.** Server-side keys (Anthropic, Twitch) are read from env and used server-side only. Error responses must not include upstream error bodies verbatim.
3. **Proxy routes must validate the target against the allowlist.** `audio-proxy` and `playlist-proxy` accept a URL parameter, so they validate it via `lib/stream-analyser/allowed-domains.ts` before fetching. That helper uses the WHATWG `URL` parser deliberately — **not** string matching. Do not "simplify" it to `startsWith`/`includes`; the parser-based check is the point, and the existing test covers it.

## The routes

| Route | Purpose | Allowlist-gated |
|---|---|---|
| `contact/` | contact form submission | — |
| `stream-analyser/channel/` | Twitch channel lookup | — |
| `stream-analyser/claude/` | AI feedback via Anthropic | — |
| `stream-analyser/audio-proxy/` | proxies Twitch audio segments | **yes** |
| `stream-analyser/playlist-proxy/` | proxies Twitch HLS playlists | **yes** |

`stream-analyser/__tests__/audio-proxy.test.ts` covers the proxy validation. If you touch allowlist logic, that test is the one that must still pass.

## Reminder

This repo is **public**. Nothing here should contain a secret value, an internal hostname, or internal security-assessment commentary. Those belong in the gitignored `gaps.md`.
