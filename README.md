# SkylerMayday.com

Phase 1 build. Next.js 15 (App Router) + TypeScript + Tailwind CSS v4.

## Run locally

```bash
npm install
cp .env.local.example .env.local   # fill in real values, see table below
npm run dev
```

## Environment variables

Set these in Vercel Project Settings → Environment Variables (Production +
Preview) for deployment, or in `.env.local` for local dev. None of these
are `NEXT_PUBLIC_` — every credentialed call runs server-side only.

| Name | Required | Purpose | Where obtained |
|---|---|---|---|
| `TWITCH_CLIENT_ID` | yes | App Access Token exchange + Helix calls | Twitch Developer console |
| `TWITCH_CLIENT_SECRET` | yes | App Access Token exchange | Same Twitch app |
| `TWITCH_BROADCASTER_ID` | yes | Numeric user id whose clips/VODs to pull | Resolve via `GET /helix/users?login=<name>` |
| `YOUTUBE_API_KEY` | yes | YouTube Data API v3 read-only | Google Cloud console, restricted to YouTube Data API |
| `YOUTUBE_CHANNEL_ID` | yes | Channel to pull uploads from | Your YouTube channel id (`UC...`) |
| `RESEND_API_KEY` | yes | Send contact email | resend.com free tier |
| `CONTACT_TO_EMAIL` | yes | Inbox that receives contact submissions | Your email |
| `CONTACT_FROM_EMAIL` | yes | Verified sender for Resend | Use `onboarding@resend.dev` sandbox sender until `skylermayday.com` is verified in Resend |
| `DISCORD_WEBHOOK_URL` | yes | "New submission" ping | Discord server → channel → Integrations → Webhooks |
| `STREAM_ANALYSER_URL` | yes | External link-out target on /tools | Existing Railway app URL |
| `GITHUB_BINDERS_RAW_BASE` | no | Base URL for binder JSON | Defaults to `https://raw.githubusercontent.com/SkylerMayday/binders-pokedex-binder/main` |

If a required var for a given feature is missing, that feature degrades
gracefully rather than crashing the build or the page (e.g. `/content`
omits Twitch if Twitch env vars aren't set; `/tools` shows a "coming soon"
card if `STREAM_ANALYSER_URL` is unset).

## Editing shop listings

Edit `data/shop-listings.json` by hand, add any referenced photo to
`public/cards/`, commit, and push. Vercel redeploys automatically. There is
no admin UI or CMS — this is intentional for Phase 1.

Each listing:

```json
{
  "id": "unique-slug",
  "name": "Card name",
  "set": "Set name",
  "price": 100.0,
  "currency": "SGD",
  "status": "available",
  "image": "/cards/photo.jpg",
  "description": "optional",
  "addedAt": "2026-07-01"
}
```

`status` must be `"available"` or `"sold"`. Malformed records are dropped
at build/render time with a server warning — they won't crash the page,
but they also won't appear, so double-check the JSON is valid before
pushing (a syntax error in the file will fail the build entirely, which is
intentional).

## Rendering / caching strategy

- Static: About, Tools, 404, Contact shell.
- ISR 15 min: Home, PTCG bookcase + binder detail.
- ISR 30 min: Content feed.
- Contact route: always dynamic (Node.js runtime).

A shop edit shows up on the next push/redeploy. A binder or content change
shows up within one revalidate window.

## Known open items (see spec §10)

1. Confirm Skyler's Twitch login/broadcaster id and YouTube channel id if
   not already resolved.
2. Live `binder.json` has no `isPublic` field — every binder present in the
   file is treated as public. Confirm the Android app filters non-public
   binders before publishing (assumed yes).
3. Resend sender domain: using the sandbox sender until
   `skylermayday.com` is verified in Resend.
4. About page copy (`data/site-config.ts`) is placeholder — replace with
   real bio/brand story/schedule/handles.
5. `public/og-image.png` is a placeholder — replace with a real social
   share image.

## Deployment

Import the GitHub repo into Vercel (Hobby tier is fine). Set all env vars
above for both Production and Preview. Set the apex + `www` DNS records to
point at Vercel per the domain decision in the PRD.
