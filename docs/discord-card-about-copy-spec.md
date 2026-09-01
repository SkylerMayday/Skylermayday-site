# Discord Bot Card Expansion + About Page Real Copy — Spec

Status: **Approved 2026-07-12** (scoped directly with Skyler this session)
Date: 2026-07-12
Owner: Skyler (Tan Jia Hong / SkylerMayday)
Code repo: `D:\Claude Projects\skylermayday-site`

Two independent parts, one feature branch of work.

---

## Part A — Discord bot card: public command list + invite link

### A1. Invite link (auto-pulled, decided by Skyler)

- Extend `lib/discord.ts`: the widget JSON already returns `instant_invite` (verified live 2026-07-12: `https://discord.com/invite/dns2Eatr`, server "Skyler's Lounge"). Add `inviteUrl: string | null` to `BotStatus`, populated from `instant_invite` when present. Type the field on `WidgetResponse` as `instant_invite: string | null` (Discord returns `null` when no invite channel is configured).
- On the Discord bot card (`app/projects/page.tsx`): when `inviteUrl` is non-null, render a clearly styled "Join the Discord" external link (new tab, `rel="noopener noreferrer"`). When null or widget unavailable, render no invite link at all (no dead button).
- Do NOT hardcode the invite URL anywhere. `data/site-config.ts`'s `discordInviteUrl` stays as-is (unused placeholder) — out of scope.

### A2. Public command list ("available to everyone")

Add a compact, progressive-disclosure section to the Discord bot card — recommended: native `<details>`/`<summary>` ("What everyone can use" or similar) so the card stays visually balanced in the grid when collapsed. No client JS required.

Content (verified against the bot's actual permission gates in `D:\Claude Projects\DiscordBot\src\modules\*` — everything below has NO permission requirement; do not add mod/admin commands like !warn, !giveaway start, !reminder add, !quotemgr, !welcome, !logsetup, !livestream, setlevelchannel, levelrole, tempchannel setup):

| Group | Commands / how |
|---|---|
| XP & Levels | Earn XP by chatting and hanging out in voice. `!rank` (aliases `!level`, `!xp`), `!leaderboard` (`!lb`, `!top`) |
| Quotes | React 💬 to any message to save it. `!quote` (random), `!quote #<id>`, `!quote <category>`, `!animequote` |
| Music | `!play <song/url>`, `!skip`, `!pause` / `!resume`, `!stop`, `!queue`, `!nowplaying`, `!loop`, `!volume <0-100>` |
| Translation | `!translate <text>` (to English), `!translate <lang> <text>` |
| Birthdays | `!birthday set <day> <month> [year]`, `!birthday remove` |
| Temp voice channels | `!tempchannel create [name] [limit]`, `!templock` / `!tempunlock`, `!templimit <n>` |
| Giveaways | React 🎉 on a giveaway post to enter (remove to un-enter) |
| Help | `!help` — full command list in Discord |

Presentation: group name + commands in `<code>`-styled inline chips or a simple definition list; must stay readable at 375px and in dark mode. Keep the existing status widget (avatar/online dot) untouched above it.

Acceptance:
- Card collapsed by default; expanding shows all 8 groups exactly as above.
- Invite link present and correct when widget returns an invite; absent (not broken) when it doesn't.
- No mod/admin command appears.

---

## Part B — About page real copy (replaces all placeholders)

All copy changes live in `data/site-config.ts` (single source), plus a minimal structural change to `app/about/page.tsx` to support multi-paragraph bio/story. Home page picks up tagline/heroBlurb automatically wherever it already consumes them.

### B1. `site-config.ts` — exact values (verbatim; remove every `[VERIFY]` comment)

- `tagline`: `"Cozy + hype variety streamer from Singapore — games, Pokémon TCG, food, and builds."`
- `heroBlurb`: `"Live on Twitch Mondays. Chasing Pokédex completion, hunting good food around Singapore, and building things in between streams."`
- `aboutBio` — change type to `string[]` (one entry per paragraph); `app/about/page.tsx` renders each as its own `<p>`:
  1. `"I'm Skyler — better known as SkylerMayday — a variety streamer from Singapore. I've been on Twitch since 2013, streaming a bit of everything: games of all kinds, Pokémon TCG pack openings (a 20-plus-year collecting habit), and food adventures around the island with the packs-of-noods crew. #teamfatnoods"`
  2. `"The vibe is cozy first — a safe, chill space where chat is part of the room, with genuine hype when the moment earns it. Regulars get greeted by name, lurkers get invited in, and my co-host (and wife) Sparks plus Bailey the chinchilla make regular appearances."`
  3. `"Off-stream I build the tools on this site — a stream analyser, a Pokédex collection tracker, a Discord bot, and whatever else the stream needs next."`
- `brandStory` — also `string[]`:
  1. `"Streaming isn't just pressing the start button. It's experimenting, learning new things, playing games worth talking about, making friends, and building a community — that overlap is why I do it."`
  2. `"The goal hasn't changed since day one: keep it a safe space, keep the reactions genuine, and support local — Singapore creators, indie studios, and every food spot the stream visits."`
- `platformLinks` — five rows, this order, `[VERIFY]` comments removed (handles verified against the vault profile):
  1. Twitch / `skylermayday` / `https://twitch.tv/skylermayday`
  2. TikTok / `@skylermayday` / `https://www.tiktok.com/@skylermayday`
  3. Instagram / `@skylermayday` / `https://www.instagram.com/skylermayday`
  4. YouTube / `@skylermayday` / `https://youtube.com/@skylermayday`
  5. X (Twitter) / `@SkylerMayday` / `https://x.com/SkylerMayday`
- `schedule` — replace the three placeholder rows with:
  1. `{ day: "Mondays", time: "~8:00 PM SGT", what: "Variety stream — games + Pokémon TCG pack openings" }`
  2. `{ day: "Roughly monthly", time: "—", what: "Packs of Noods — food IRL stream around Singapore" }`
- `discordInviteUrl`: leave untouched.

### B2. `app/about/page.tsx`

- Render `aboutBio` and `brandStory` as paragraph arrays (`.map` → `<p>`, keyed by index, same existing text classes).
- No other structural changes. Platform and schedule tables render the new data as-is.

Acceptance:
- No `[VERIFY]` or "placeholder" strings remain anywhere in `data/site-config.ts` (except the untouched `discordInviteUrl` comment) or rendered pages.
- About page shows 3 bio paragraphs, 2 story paragraphs, 5 platform rows, 2 schedule rows.
- Home hero shows the new tagline/heroBlurb wherever it consumed them before (no layout change).

---

## Non-Goals

- No Contact-page Discord invite (P2 — could reuse the same widget field later).
- No changes to the bot itself or its docs.
- No bot detail page — the command list lives on the card.
- No schedule auto-pull from Twitch API (still the P1 item from the original site spec, separate).

## Verification Notes

- Unit-test surface: `lib/discord.ts` invite parsing (present / null / widget-unavailable paths) if a test seam exists or is cheap; otherwise static + rendered-HTML verification.
- Build + lint + existing test suite (64 tests) must stay green.
- Local `next start` render check: /projects card (collapsed + expanded states in HTML), /about paragraphs/tables, / hero copy. The widget fetch may fail locally (TLS interception) — the unavailable path renders no invite link, which is itself a valid check of the fallback; confirm the happy path post-deploy.
