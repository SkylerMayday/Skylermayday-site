---
# Machine-readable token snapshot. Prose below is authoritative for *why*;
# these are the exact values actually shipped. Added iteration 3 (2026-08-04).
project: skylermayday-site
system: sitewide-rebrand-v1
revision: 3
updated: 2026-08-04
color:
  brand:
    brand: "#9146FF"
    brand-strong: "#6E2FD1"
    brand-soft: "#BF94FF"
    accent: "#F2941C"
    accent-strong: "#A85C00"
    danger: "#C4283C"
    danger-soft: "#E995A0"
    success: "#1F8A5F"
  dark:
    bg: "#0F0B16"
    surface: "#1A1424"
    surface-hero: "#1B0F2E"
    border: "#2A2137"
    border-hero: "#3A2A55"
    fg: "#EDE9F2"
    fg-muted: "#A79FB5"
    fg-muted-hero: "#C9C0D8"
  light:
    bg: "#F7F7F8"
    surface: "#FFFFFF"
    surface-hero: "#1B0F2E"
    border: "#E2E1E6"
    fg: "#16121C"
    fg-muted: "#55505F"
typography:
  family: "League Spartan"
  mono: "system mono stack (utility role only)"
  weights: [400, 500, 700, 900]   # 100/200/300/600/800 are banned (anti-goal 9)
  scale:
    display: { mobile: 40, desktop: 64, weight: 900, tracking: "-0.03em", leading: 0.98 }
    h2:      { mobile: 28, desktop: 36, weight: 700, tracking: "-0.02em", leading: 1.15 }
    h3:      { mobile: 20, desktop: 22, weight: 700, tracking: "-0.01em", leading: 1.25 }
    lead:    { mobile: 18, desktop: 20, weight: 400, tracking: "0",       leading: 1.5 }
    body:    { size: 17, weight: 400, leading: 1.65, measure: "68ch" }
    small:   { size: 14, weight: 500, leading: 1.45 }
spacing:
  grid: 4                          # Tailwind default scale
  section-rhythm: { mobile: 64, desktop: 96 }   # py-16 sm:py-24
  card-padding: 20
  container-max: 1024              # max-w-5xl
  touch-target-min: 44
radius:
  chrome: 8                        # rounded-lg
  binders: 0                       # deliberate square corners, frozen subsystem
motion:
  micro: { duration: 150, easing: "ease-out" }
  link-card-button: { duration: 160, easing: "ease-out" }
  theme-toggle: { duration: 200, easing: "ease-out" }
  reduced-motion: "every transition suppressed via prefers-reduced-motion"
focus-ring: { width: 2, offset: 2, color: "var(--brand)" }
state-dimming: "surface and imagery only, never text — see §5.4"
---

# DESIGN.md — SkylerMayday.com

The persistent design source of truth for this project: tokens, type, spacing, motion, and the reasoning behind them. Established 2026-07-31 by the sitewide rebrand v1 run (`design-team-pipeline`, Stage 1). Prior to this, the site had no design system — only Next.js scaffold defaults plus two self-contained subsystems (the PTCG bookshelf's wood material system and the per-generation spine palette).

**Status: SHIPPED (Stage 2, 2026-07-31; retokening completed in Stage 2 iteration 2, 2026-08-01).** All three deliverables (League Spartan sitewide, class-based dark mode + manual toggle, `app/opengraph-image.tsx`) are implemented on `main`. Values changed or discovered during implementation are folded in below rather than left to drift — see §7.3's addendum and §11's decisions log for what changed and why. Pending: Stage 3 (Tester) re-run and Stage 4 (Reviewer) re-review, and a post-deploy `npm run test:visual:update` pass (§7.1/§11 — this repo's visual regression suite targets live production and cannot be meaningfully run pre-deploy).

**Iteration 2 (2026-08-01)** closed the Stage 4 verdict's §7 list: the system now reaches every in-scope route rather than the homepage plus chrome. Two tokens were added (`--success`, `--danger-soft`), `--accent` was given a concrete, measured home in the shipped UI, RISK 1's mandatory body mitigation became a reusable `.prose-block` class instead of per-page utilities, and a skip-to-content link was added. See §3.1, §4.3, §5, §11.

**Iteration 3 (2026-08-04)** closed the remaining WCAG AA failures and the two consistency gaps behind them. No new tokens. The substantive addition is **§5.4, the state-dimming rule** — a written convention replacing three ad-hoc "dim the whole subtree" treatments that each composited their own text below AA. The binders subsystem was brought onto the sitewide type scale, focus ring, and green under design-brief.md §5.6's values-and-mechanism amendment (§10 records exactly what stayed frozen). Verified live: **zero axe moderate-or-worse violations across 9 routes × 2 themes.** See §5.4, §10.1, §11.

**How to use this file.** These tokens are the existing system. Extend them; don't replace them. A future design run that departs from a rationale recorded here is taking a **RISK** and must say so explicitly, not drift silently.

Full proposal, SAFE/RISK split, component-level application notes, and the OG image spec: `.pipeline/design-brief.md` (2026-07-31).

---

## 1. Product context

Personal marketing site for **SkylerMayday** (Tan Jia Hong), a Singapore-based Twitch variety streamer. Content pillars: games, Pokémon TCG pack openings, food IRL streams (`#teamfatnoods`), Lego/brick builds. Twitch Affiliate, streaming since 2013; Twitch is the primary platform.

Site type: marketing site with two real app surfaces attached (Stream Analyser, PTCG Binders). Stack: Next.js 15 App Router, React 19, Tailwind v4, deployed on Vercel.

**Memorable thing** — *in-between "genuine cozy hangout run by a real person" and "legit/credible creator." Deliberately not purely one or the other.*

**Scene sentence** — *a viewer on their phone, arriving from a TikTok bio link or a Twitch panel, browsing casually and low-stakes, often at night just before a stream, who wants to pick light or dark themselves rather than inherit the OS.*

The scene sentence is what decides dark-vs-light. It forces **dark-primary**: the arrival context is a phone, at night, one tap from a Twitch panel. Light mode is a fully designed equal, but it is the alternate, not the canon.

---

## 2. Aesthetic direction

**Editorial-with-warmth.** Strong weight-driven typographic hierarchy on flat, hard-edged planes — magazine structure, not SaaS chrome. Warmth is carried by one saturated accent and by real photography/illustration, never by a warm-tinted background.

**Decoration: low-to-moderate.** Real content only — Twitch/YouTube thumbnails, TCG card art, the illustrated OG backdrop. The only non-content graphics permitted are 1px hairline rules and flat color planes.

### The organising idea

Every streamer site treats "cozy" and "legit" as opposites and picks one — warm/pastel/rounded, or dark/neon/sharp. Skyler's own bio doesn't split that way: *"cozy first — a safe, chill space where chat is part of the room, with genuine hype when the moment earns it."* Cozy is the **room**; hype is the **moment**. So the split is material, not tonal:

> **Purple is the room. Orange is the moment.**

The surface is a calm, low-noise night room. The one warm saturated accent appears only where something is actually happening. That sentence is the whole system, and it is why the color commitment level is Committed rather than Restrained.

---

## 3. Color

**Commitment level: COMMITTED** — one saturated hue carries 30–60% of the surface. In dark mode the brand hue is present across essentially the entire surface at varying values (tinted page background, deep purple hero plane, saturated interactive fills). Light mode is a true chroma-0 cool off-white with the same hue system layered on top.

All ratios below are measured by the WCAG 2.x relative-luminance formula against the stated background.

### 3.1 Brand

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--brand` | `#9146FF` | Identity purple. Fills, buttons, focus rings, active states, large type ≥24px. **Never body-size text on either background.** | white on it 4.64:1 ✅AA · on `#F7F7F8` 4.33:1 ❌AA-normal ✅AA-large · on `#0F0B16` 4.19:1 ❌ ✅large |
| `--brand-strong` | `#6E2FD1` | Light-mode link/text purple; also `--brand`'s hover-darken. | on `#F7F7F8` **6.55:1** ✅ · white on it 5.81:1 ✅AA |
| `--brand-soft` | `#BF94FF` | Dark-mode link/text purple. (Twitch's own light purple.) | on `#0F0B16` **8.24:1** ✅AAA · on `#1B0F2E` 7.71:1 ✅AAA |
| `--accent` | `#F2941C` | Warm accent — **its one home in the site UI is `ContentCard`'s duration chip** (see §3.5), plus the OG image's domain line. **Dark planes only.** | on `#0F0B16` **8.36:1** ✅AAA · on `#1B0F2E` 7.82:1 ✅AAA · composited on the duration chip: **5.59:1** worst case (over a pure-white thumbnail), 7.16:1 over mid-grey, 8.47:1 over black — all ✅AA · on `#F7F7F8` **2.17:1** ❌ banned as light-mode text |
| `--accent-strong` | `#A85C00` | Light-mode text form of the accent, where one is unavoidable. **Still unused** — kept because the constraint it exists for is permanent, not because a surface needs it yet. | on `#F7F7F8` **4.67:1** ✅AA (verified; the figure §3.1 originally left open) |
| `--danger` | `#C4283C` | Destructive / sold-out semantic. Fills, borders, and light-mode error text. | white on it **5.65:1** ✅AA · on `#F7F7F8` **5.28:1** ✅AA · on `#0F0B16` **3.44:1** ❌ AA-normal → not a dark-mode text colour, use `--danger-soft` |
| `--danger-soft` | `#E995A0` | **Dark-mode text form of `--danger`**, exactly mirroring `--brand`/`--brand-soft`. Derived algorithmically from `--danger` — same hue (352.3°) and saturation (66%), lightness 46.3% → 75%. | on `#0F0B16` **8.62:1** ✅AAA · on `#1A1424` 7.96:1 ✅AAA · on `#F7F7F8` 2.23:1 ❌ dark-mode only |
| `--success` | `#1F8A5F` | Status-positive. Currently the Discord bot's online indicator on `/projects`. Lifted from `sectionSpineColors.ts`'s Generation III block — same shared-origin rule as `--accent`/`--danger`, re-declared as its own literal, never imported. **Fill/tint only, never text.** | vs light `--bg` **4.04:1**, vs dark `--bg` **4.50:1** — both clear the 3:1 WCAG 1.4.11 non-text floor; light misses the 4.5:1 text floor, hence fill-only |

### 3.2 Dark theme (canonical)

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--bg` | `#0F0B16` | Page. Purple-tinted near-black — not `#000`, not neutral gray. | — |
| `--surface` | `#1A1424` | Cards, panels, header. | — |
| `--surface-hero` | `#1B0F2E` | The always-dark hero plane. Identical in light mode. | — |
| `--border` | `#2A2137` | Hairlines, card borders. | — |
| `--border-hero` | `#3A2A55` | The hero band's 1px top/bottom edge. | — |
| `--fg` | `#EDE9F2` | Body text. | **16.2:1** ✅AAA |
| `--fg-muted` | `#A79FB5` | Secondary / meta text. | **7.66:1** ✅AAA |
| `--fg-muted-hero` | `#C9C0D8` | Muted text specifically on the hero plane (`Hero.tsx`'s `heroBlurb`) — mode-invariant, same rationale as `--surface-hero`/`--border-hero`. Added during Stage 2 implementation: named in design-brief.md §5.4 as a literal hex but not given a token in the original §4.3 tables; promoted to a token here rather than left as an inline arbitrary value in the component, per Phase 3's "hardcoded values are technical debt" rule. | high on `#1B0F2E` (light lavender on deep purple; not separately re-measured, brief's own figure) |

### 3.3 Light theme

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--bg` | `#F7F7F8` | Page. Cool off-white, chroma ≈0. Explicitly **not** the cream/sand/beige band. | — |
| `--surface` | `#FFFFFF` | Cards, panels, header. | — |
| `--surface-hero` | `#1B0F2E` | Same as dark — the hero does not invert. | — |
| `--border` | `#E2E1E6` | Hairlines, card borders. | — |
| `--fg` | `#16121C` | Body text. | **17.2:1** ✅AAA |
| `--fg-muted` | `#55505F` | Secondary / meta text. | **7.26:1** ✅AAA |

### 3.4 Rationale nodes

**Twitch Purple Anchor Rationale.** `#9146FF` is Twitch's actual brand purple, used verbatim on the site of a streamer whose primary platform is Twitch. A visitor arriving from a Twitch panel gets zero-friction visual continuity. This is a **SAFE** choice: the brand hue is not where this site should be surprising, and an "original" purple would cost recognition and buy nothing. It is also — honestly — a first-order AI-slop category reflex ("streamer site → purple, dark" is guessable from the category alone). That reflex was accepted with eyes open, which means the system's distinctiveness has to come from elsewhere. See §8.

**Gen VII Orange Reuse Rationale.** `--accent` is `#F2941C`, lifted verbatim from `components/binders/sectionSpineColors.ts`, where it is the Generation VII (Sun/Moon) spine block. Reusing it makes the site's biggest, most-invested feature the *origin* of the sitewide brand accent instead of a subsystem sitting off to one side, and it is the one palette decision nobody could guess from the category. It also happens to be a good ramen/warm-hype orange, which lands the food pillar for free.
**Critical implementation constraint**: `--accent` is defined as **its own literal `#F2941C`**, *not* imported from `sectionSpineColors.ts`. That table is frozen because it's derived from real game box art; if a future generation forces a revision there, the sitewide accent must not drift with it. The shared origin is a documented rationale, not a code dependency.
**Cost, permanent**: `#F2941C` is 2.17:1 on `#F7F7F8` — unusable as light-mode text. It lives on dark planes and as a fill only; `--accent-strong` exists for the rare light-mode text case.

**Always-Dark Hero Rationale.** `--surface-hero` (`#1B0F2E`) is the *same value in both themes* — the homepage hero stays dark even for a visitor who has chosen light mode. Four reasons converge: (1) it is the direct visual translation of the scene sentence; (2) it is the only way both accents are legible at once — `#F2941C` at 7.8:1 and `#BF94FF` at 7.7:1 on the hero plane, versus 2.17:1 and unusable on the light background, so the accent palette *requires* a dark carrier to exist at all; (3) it makes the OG image and the landing hero the same artefact rather than two things that vaguely match; (4) it stops light mode from being a mechanical inversion with no identity of its own.
**Cost**: it reads as intentional to most and as a rendering bug to some. A light-mode visitor gets a hard value jump immediately below the header, which puts real pressure on the band's edges being crisp — hence the 1px `--border-hero` hairlines top and bottom, and explicitly no soft shadow and no gradient fade. This is the decision most likely to be second-guessed; if it is ever reversed, light mode needs a genuinely designed hero treatment, not a white box.

**Cool Off-White Rationale.** `--bg` in light mode is `#F7F7F8` — chroma ≈0 and very slightly cool. The entire warm-neutral band (cream/sand/bone/linen/paper/parchment/ivory, hue 40–100, low chroma, very light) is the saturated AI-generated default of 2026 and is banned sitewide. The brief's "warmth" is carried by `--accent` and by imagery, never by the background.

**Semantic-Token Derivation Rationale (added iteration 2).** Two tokens were added after Stage 4 found the original set couldn't cover surfaces that already existed. Both were derived, not picked:

- **`--success: #1F8A5F`** — the first-pass brief deferred `--success` on the reasoning *"no current surface needs one; do not invent one speculatively."* That premise was factually wrong: `app/projects/page.tsx` has carried a Discord-bot online/offline dot since long before this rebrand, and it was rendering `bg-green-500`. Rather than invent a green, the token follows the rule already established for `--accent` (Gen VII) and `--danger` (Gen IX / VMax): lift a value verbatim from `sectionSpineColors.ts` and re-declare it as its own literal. Generation III's `#1F8A5F` is that value. It is a **fill-only** token: 4.04:1 on the light background clears the 3:1 non-text floor a status dot needs but not the 4.5:1 text floor, and the token's comment in `globals.css` says so explicitly.
- **`--danger-soft: #E995A0`** — retokening the contact form's error text onto `--danger` would have shipped 3.44:1 in dark mode, a regression. Instead of keeping a raw Tailwind red or eyeballing a lighter one, the value was generated by the same fixed-hue lightness ramp this file's methodology prescribes: convert `--danger` to HSL (352.3°, 66%, 46.3%), raise L to 75%, convert back. The result mirrors the existing `--brand`/`--brand-soft` pairing exactly — saturated form for fills in both modes, soft form for text on dark.

**Generalise**: "no surface needs this token" is a claim about the codebase, not about the design — check it with a grep before deferring a semantic colour. And when a semantic colour turns out to need a dark-mode text form, derive it from the existing token rather than introducing an unrelated hue.

### 3.5 Where `--accent` actually lives (RISK 3's traceable surface)

`--accent` is one of the four load-bearing distinctiveness decisions in §8, and the first implementation pass shipped it **defined, documented, exposed as a Tailwind utility, and consumed zero times by any rendered component** — its only appearance was inside the OG image, which a visitor never sees while on the site. A token can pass every mechanical check and still be absent from the product.

Its home is now **`components/content/ContentCard.tsx`'s duration chip** — the small runtime label on a clip/VOD thumbnail. Why that element specifically:

- §3.1 scopes `--accent` to *live/hype signals* on *dark planes only*. A real clip runtime is the closest thing this site has to a live signal, and the chip is the only permanently dark carrier outside the hero — so the accent is legible there in **both** themes without needing `--accent-strong`'s light-mode form.
- It is genuine content metadata, never invented decoration, which is what the "real-content-only decoration" rule (§2) requires.
- Measured in a real browser by compositing the chip's actual 85%-opacity `#0F0B16` background over the extremes of what a thumbnail can be: **5.59:1** over pure white, 7.16:1 over mid-grey, **8.47:1** over black. AA-normal across the entire range, not just at the nominal value.

**Deliberately not spread further.** One verified home is the fix; scattering the accent across the UI to "make it visible" would trade a traceability failure for a decoration failure. If a genuine live/hype component (a stream-status indicator) is ever built, that is `--accent`'s natural second home and it should be added there rather than anywhere decorative.

---

## 4. Typography

**League Spartan, single family, weight-driven hierarchy.** No heading/body pairing.

Loaded via `next/font/google` (`subsets: ["latin"]`, `variable: "--font-league-spartan"`, `display: "swap"`), preferring the variable instance for a single file covering 400–900. **Applied via an `@theme inline { --font-sans: var(--font-league-spartan); }` block in `app/globals.css`** — defining the CSS variable in `layout.tsx` alone does nothing, which is exactly the bug that left the previous Geist setup rendering as a system font (see §7).

`font-mono` intentionally stays on Tailwind's default system mono stack, used only for tabular readouts in Stream Analyser. That is a utility role, not a hierarchy typeface, and does not violate the single-family decision.

### 4.1 Scale

| Role | Mobile / Desktop | Weight | Tracking | Line-height |
|---|---|---|---|---|
| Display (`h1`, brand name) | 40 / 64px | 900 | −0.03em | 0.98 |
| H2 (section headings) | 28 / 36px | 700 | −0.02em | 1.15 |
| H3 (card titles) | 20 / 22px | 700 | −0.01em | 1.25 |
| Lead (hero tagline) | 18 / 20px | 400 | 0 | 1.5 |
| Body | 17px | 400 | 0 | 1.65 |
| Small / meta | 14px | 500 | 0 | 1.45 |
| Mono (tabular) | 12–13px | — | 0 | 1.4 |

**Hard rules**: four weights only — {400, 500, 700, 900}. No 100/200/300/600/800. No synthetic italics (League Spartan ships upright-only on Google Fonts; use weight 700 for emphasis inside prose). No uppercase-plus-letterspacing on any section-level label. The sole surviving uppercase treatment is `Badge`, which is a data label on a thumbnail, not a section eyebrow.

### 4.2 Single-Typeface Rationale

A hierarchy built from weight rather than family reads as deliberate rather than templated, makes a 900-weight `SkylerMayday` the single loudest thing on the site (which is exactly the memorable thing — a person's name, said confidently), and halves the font payload versus a pairing.

**Cost**: geometric sans is the weakest typeface category for long body copy. Circular bowls and near-identical `o/c/e` shapes reduce word-shape differentiation at paragraph length and small sizes. The About page (three long bio paragraphs) and `brandStory` are where this bites. The mitigations in §4.1 are **mandatory, not optional**: body at 17px (not 16), line-height 1.65, measure capped at ~68ch, weight 400 (never 300 — geometric sans at 300 goes fragile), small/meta bumped to 500.

**Escalation path if body copy still reads poorly**: a reading-specific size/leading override on prose blocks. **Not** the reintroduction of a second family — that forfeits the decision entirely and would be a new RISK requiring its own justification.

### 4.3 `.prose-block` — the mandatory mitigation, as one class

The three §4.2 mitigations are implemented as a single named class in `app/globals.css`:

```css
.prose-block {
  max-width: 68ch;
  font-size: 17px;
  line-height: 1.65;
  text-wrap: pretty;
}
```

**Use it on every long-form `<p>`.** Currently applied on `/about` (bio + brand story), `/projects/packs-of-noods` (intro, replacing `max-w-prose`), and both 404 pages.

Why a class rather than three utilities per page: the first pass applied `max-w-[68ch] text-[17px] leading-[1.65]` only to `Hero.tsx`'s two-line blurb — the one paragraph on the site that was never at risk — and left `/about`, the page §4.2 names by name, rendering at 16px/1.5 across an 882px measure. A mitigation that has to be remembered per page will be forgotten per page. Verified live after the change: 17px, `line-height: 28.05px` (= 1.65 × 17), `max-width: 671.6px` (68ch), contrast 7.27:1 light / 7.66:1 dark.

`text-wrap: pretty` is the prose half of the wrapping rule; headings use Tailwind's `text-balance` (`text-wrap: balance`) instead, applied on every `h1`/`h2`/`h3` in the retokened set.

### 4.4 Applied heading treatments (the exact utility strings)

So the next page doesn't re-derive them:

| Role | Tailwind |
|---|---|
| h1 / Display | `text-balance text-[40px] leading-[0.98] font-black tracking-[-0.03em] sm:text-[64px]` |
| h2 / Section | `text-balance text-[28px] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[36px]` |
| h3 / Card title | `text-balance text-[20px] leading-[1.25] font-bold tracking-[-0.01em] sm:text-[22px]` |
| Body | `prose-block` (+ a colour utility) |
| Small / meta | `text-sm font-medium` or `text-xs font-medium` |

---

## 5. Spacing & layout

- **Base grid**: 4pt (Tailwind's default scale). Already this repo's stated convention — `globals.css` cites the 4pt grid explicitly in the bookshelf comments.
- **Container**: `max-w-5xl` (1024px), `px-4` mobile / `px-6` at ≥640px.
- **Section rhythm**: 64px mobile / 96px desktop between top-level sections.
- **Card interior padding**: 20px.
- **Border radius**: **8px for all site chrome.** The PTCG binder subsystem keeps its documented square corners (a deliberate v8 decision — real furniture doesn't round).
- **Touch targets**: ≥44px on mobile. Applies to the theme toggle.
- **Breakpoints**: Tailwind defaults. Mobile-first; `sm:640` is the meaningful chrome breakpoint, `md:768` the nav breakpoint.
- **Layout is frozen for the v1 rebrand**: Hero → ContentTeaser → QuickLinks, left-aligned hero, single column on mobile. This was a visual-system pass; information architecture was explicitly out of scope.

### 5.1 Section rhythm, as applied

Every top-level page wrapper uses `py-16 sm:py-24` (64px mobile / 96px desktop). This is the only section rhythm on the site — `py-10` (40px) was a second, competing rhythm inherited from the pre-rebrand pages and is now gone from every in-scope file. Verified live: the first child of `<main>` computes `padding-top: 96px` on all nine top-level routes in both themes.

### 5.2 One recipe per control (the consistency contract)

The Stage 4 review's single largest deficit was three button recipes, two link colours, two heading scales, and two section rhythms coexisting. The contract now is one of each:

| Control | Recipe |
|---|---|
| Primary button / CTA | `rounded-lg bg-brand text-white hover:bg-brand-strong` + 150ms `transition-colors` + `motion-reduce:transition-none`. Used by the 404 CTA, the binder-section 404 CTA, the contact form's submit, and the Discord CTA. |
| Selected pill / tab | `border-brand bg-brand text-white`; unselected `border-border bg-surface text-fg-muted hover:border-brand hover:text-fg` |
| Text link | `text-brand-strong dark:text-brand-soft` + `hover:underline hover:underline-offset-[3px]` |
| Active nav route | 2px `--brand` underline at `underline-offset-[6px]` — **identical on desktop and mobile**, never colour alone |
| Card (any) | `border border-border` → `hover:border-brand` + `hover:-translate-y-0.5`, 150ms ease-out, `motion-reduce:` fallback, no shadow |
| Icon tile | `bg-border text-fg-muted`; active adds `bg-brand/15 ring-2 ring-brand` |
| Skeleton block | `animate-pulse bg-border` |
| Input / select | `rounded-lg border border-border bg-surface text-fg`; invalid adds `border-danger` **and** `aria-invalid` |
| Focus ring | 2px `--brand` at 2px offset — `focus-visible:ring-2 focus-visible:ring-brand` where a `ring-offset-<colour>` can be named, `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand` where the control sits on more than one backdrop (outline-offset leaves a transparent gap, so it needs no offset colour). **Never a non-`--brand` hue.** |
| Category badge pair (`ProjectBadge`) | Both variants are a low-alpha wash of one hue with that hue's readable form as text, at **matched luminance** — `bg-brand/12 text-brand-strong dark:bg-brand/25 dark:text-brand-soft` and `bg-fg-muted/10 text-fg-muted dark:bg-fg-muted/17`. See §5.5. |

**Do not add a second recipe for any row above without recording it here as a RISK.**

### 5.5 Matched visual weight for peer badges (added iteration 3)

Two badges that sit adjacent on the same card and rank equally must *look* equal, or the difference reads as a hierarchy that doesn't exist. `ProjectBadge` shipped `bg-brand/12 text-brand-strong` (pale lilac) next to `bg-border text-fg` (a solid mid-grey with near-black text) — heavier on **both** axes.

The fix matches both, and the alphas are **tuned by measured relative luminance, not chosen from the scale**:

| | fill L (light) | fill L (dark) | text on fill (light / dark) |
|---|---|---|---|
| `stream-content` — the reference | 0.7889 | 0.0195 | 5.61:1 / 6.40:1 |
| `vibe-coded` — was `bg-border text-fg` | 0.7573 | 0.0186 | 14.20:1 / 12.79:1 |
| `vibe-coded` — now `bg-fg-muted/10` ÷ `/17` | **0.7869** | **0.0193** | **6.20:1 / 5.96:1** |

Rendered deltas between the two variants: fill luminance **0.00207** light / **0.00012** dark, text contrast **0.59** / **0.44**. Both also re-checked over `ProjectCard`'s muted surface (lowest figure anywhere: 5.47:1).

**Generalise**: peer elements are matched on *fill lightness and text contrast together*. Matching only the fill leaves near-black text beside mid-tone text and the pair still reads unequal. And a "neutral" member of a pair is a **wash of the neutral hue**, not the `--border` hairline token — `--border` is sized to be a 1px line against a surface, not a fill competing with a colour tint.

### 5.3 Accessibility floor

- **Skip link**: `.skip-link` in `globals.css`, rendered as the first focusable element in `app/layout.tsx`, targeting `id="main"` on `<main>`. Verified: first Tab press focuses it, it reveals at 126×44px fixed at top-left, white on `--brand` (4.64:1), and Enter moves to `#main`.
  It is written as a plain class rather than Tailwind's `sr-only focus:not-sr-only` pair because `not-sr-only` resets `padding` to `0` — measured, the utility version rendered 88×20px with `px-4 py-2` silently overridden. If you rebuild this, don't reach for the utility pair.
  **`<main id="main">` carries `tabIndex={-1}`, and that attribute is the feature.** A plain in-page anchor moves the visual scroll position but not the accessibility tree's focus when the target isn't focusable — without it the link works for sighted keyboard users and does nothing for the screen-reader users it exists to serve (WCAG 2.4.1). Negative tabindex keeps `<main>` out of the Tab order while making it a valid programmatic focus target. Verified live in both themes: after Tab → Enter, `document.activeElement.id === "main"`.
- **Heading order is a structural requirement, and `sr-only` is a legitimate way to satisfy it.** A card grid whose items are `<h3>` needs an `<h2>` above it even when the page has no room for a visible one — `/shop`'s `ShopGrid` ("Listings") and `/content`'s `PlatformFilter` (named after the active tab, e.g. "Twitch content") both carry one. Don't demote the card headings to fix the skip; the cards genuinely are third-level.
- **Never colour-only**: every state that uses colour also carries a second channel — the nav's active route gets an underline, the bot status dot is paired with the words "Online"/"Offline" and is itself `aria-hidden`, invalid inputs get `aria-invalid` alongside `border-danger`.
- **Label-less controls get `aria-label`**: `/shop`'s two filter `<select>`s are `"Filter by set"` and `"Filter by availability"`.
- **Touch targets**: ≥44px. The theme toggle, the shop selects (`min-h-11`), and the filter icon tiles all satisfy it.

### 5.4 State dimming — the rule (added iteration 3, and it is a rule, not a preference)

> **Muted / sold / disabled states dim the surface and the imagery, never the text.**
> Apply `opacity` / `grayscale` to the **background layer or the `<img>`**, and express the state on text via a **token (`--fg-muted`) at full opacity**.
> **Any contrast figure quoted in a comment must be measured in the state it ships in, not in isolation.**

`opacity` and `filter` on a container create a new stacking/compositing group and apply to the **entire subtree** — every child's text included. A token that measures 7.26:1 on its own composites to 4.12:1 through a 75% parent. The token value in the source is then a true statement about a colour that is never painted.

This shipped three times before anyone noticed, in three unrelated components, which is what makes it a missing convention rather than three typos:

| Component | Was | Composited | Now |
|---|---|---|---|
| `ProjectCard` (past/archived) | `opacity-75` on the container | 4.12:1 light / 4.46:1 dark ❌ | `bg-surface/75` — the dimming is *in the background colour*. 18.15:1 title / 7.65:1 body light, 15.45:1 / 7.29:1 dark |
| `ShopCard` (sold) | `opacity-60 grayscale` on the container | 2.82:1 ❌, and `grayscale` filtered the `--danger` "Sold" chip to a neutral grey pill — deleting the one semantic that badge exists to carry | the classes moved onto the `<Image>` / `<Placeholder>` only. Copy at 17.25:1 / 7.27:1, chip at 5.65:1 white-on-`--danger` |
| `ContactForm` (submit) | `disabled:opacity-60` | 2.53:1 ❌ *while displaying "Sending…"* | no dimming at all. The `disabled` attribute makes it non-interactive; the changed label and `cursor-not-allowed` carry the affordance |

**On the third one specifically**: WCAG 1.4.3 exempts inactive controls, so it was never a gate failure — it was still wrong, because `disabled:` was reached for when the real state is **pending**. *Pending is "busy", not "invalid".* A busy control should stay at full contrast; it is the one moment the user most needs to read it. If a genuinely invalid/unavailable disabled state is ever added here, that is a different state and needs its own treatment, not a revival of this one.

**How to check a new one**: composite the actual painted pixel. `getComputedStyle` returns the *nominal* colour, not what the compositor produced — for `color-mix(in oklab, …, transparent)` (which is what Tailwind v4 emits for every `/<alpha>` utility) it doesn't even return an `rgb()` string. Paint the backdrop and then the colour into a 1×1 `<canvas>` and read `getImageData`; that is the browser's own compositor answering.

---

## 6. Motion

| Element | Change | Duration / easing |
|---|---|---|
| Link | color → `--brand-soft` / `--brand-strong`, underline offset 3px | 160ms ease-out |
| Card (`ContentCard`, `QuickLinks`) | border → `--brand`, `translateY(-2px)` | 160ms ease-out |
| Button | fill → `--brand-strong` | 160ms ease-out |
| Theme toggle icon | crossfade + 90° rotate | 200ms ease-out |
| Focus ring | none (instant) | — |

Subtle only — no scroll-triggered animation, no parallax, no entrance animation. This matches the brand's stated "no performance filter" trait: the site shouldn't perform either.

`@media (prefers-reduced-motion: reduce)` suppresses **every** transition above, including the toggle's rotation (icon swaps instantly). `globals.css` already establishes this convention in three places (`.binder-obj`, `.binder-contact-shadow`, `.card-zoom-*`) — follow it, don't invent a parallel one.

---

## 7. Theming mechanism

**Class-based, via `next-themes`.** `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`. `<html suppressHydrationWarning>`. Tailwind v4 is retargeted with a single line in `globals.css`:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

That one declaration retargets all ~201 existing `dark:` utility occurrences across 42 files. **None of them need editing.** Do not attempt a sweeping class rewrite.

### 7.1 Wood-Subsystem Selector Rationale (important — read before editing `globals.css`)

The PTCG bookshelf's `--wood-*` / `--grain` / `--binder-*` tokens and the `sectionSpineColors.ts` table are a **separate, frozen subsystem** with eight documented iterations behind them. Their **values must never change** as part of sitewide brand work.

Their **selectors did have to change.** `globals.css` originally carried four `@media (prefers-color-scheme: dark)` blocks (the `:root` wood tokens, `.binder-top-face`, `.binder-contact-shadow`, `.binder-cabinet`). Leaving those on a media query while the page chrome moved to a class would mean a visitor on a light-OS device who manually toggles to dark gets a dark page wrapped around a *light-mode bookshelf* — a visible bug on the site's most-designed page. All four were converted to `.dark` selectors with every hex, rgba, and comment byte-identical.

**Generalise this**: "don't touch subsystem X" is a rule about values, not about global mechanisms. When a mechanism changes sitewide, frozen subsystems have to move with it or they break.

### 7.2 Toggle behaviour contract

Two-state button (light ↔ dark) — implemented as `components/ui/ThemeToggle.tsx`, rendered from `components/layout/Header.tsx` (desktop nav and the mobile bar, both breakpoints, per design-brief.md §5.3 "visible at every breakpoint"). `next-themes`' `ThemeProvider` itself is wrapped in `components/providers/ThemeProvider.tsx` — a thin `"use client"` boundary so `app/layout.tsx` can stay a Server Component. System preference is the *initial resolution*, not a user-selectable third position — do not add a tri-state cycle.

- Nothing is written to `localStorage` until the user actually clicks.
- `next-themes`' inline blocking script sets the class before first paint. **A flash of the wrong theme is a misconfiguration, not a known limitation.**
- Pre-mount, render a **fixed-dimension placeholder button** (same 44×44 box, `aria-hidden` icon slot) so mounting causes zero layout shift. Never conditionally render nothing.
- `aria-label` changes with state ("Switch to dark theme" / "Switch to light theme"). Use a real `<button>`; do **not** use `aria-pressed` — the changing accessible name is the clearer pattern for a two-state mode switch.
- Focus: 2px `--brand` ring, 2px offset. Space and Enter both activate.
- `localStorage` unavailable (private mode / blocked): must not throw. Theme applies for the session, silently fails to persist.
- OS theme changes while the user has an explicit stored choice: the stored choice wins. Do not re-sync.

### 7.3 Font-Wiring Rationale (the bug this system was born from)

Before this rebrand, `app/layout.tsx` loaded `Geist` and `Geist_Mono` and set `--font-geist-sans` / `--font-geist-mono` on `<body>` — **and nothing ever consumed them.** No `@theme` block, no `font-family` declaration, zero references anywhere in the codebase. Tailwind's `font-sans` resolved to its default system stack, so the site rendered in Segoe UI / SF / Roboto while downloading two unused Google font families on every page load.

**Consequence to remember**: in Tailwind v4, declaring a `next/font` CSS variable is only half the wiring. The `@theme inline { --font-sans: var(--font-…); }` binding in `globals.css` is what actually applies it. A future font change that edits only `layout.tsx` will silently no-op in exactly the same way.

**Second sharp edge, found during Stage 2 verification (not anticipated in the original brief)**: even with both halves wired, the font variable's className must live on `<html>`, not `<body>`. Tailwind v4's Preflight sets `font-family: var(--default-font-family, …)` on the `html, :host` selector. CSS custom properties only resolve using variables visible on the *same element* or an *ancestor* of it — a variable class placed on `<body>` (a child of `<html>`) is invisible to a `var()` reference resolved at `<html>`'s own scope, so `--font-league-spartan` silently failed to resolve there and `font-family` fell through to the fallback system stack, even though the variable itself and the `@theme inline` binding were both correct. Caught via a live computed-style check (`getComputedStyle(h1).fontFamily`) before and after moving `leagueSpartan.variable` from `<body>`'s className to `<html>`'s. **Generalise**: any next/font variable feeding a Preflight-level (`html`/`:host`-scoped) property must be placed on `<html>` itself, not `<body>` — the common "put the font variable on body" tutorial pattern only works when the *consuming* `font-family` declaration is also scoped to `body` (or lower), which is not the case here.

### 7.4 CSP compatibility

`next.config.ts`'s CSP already permits everything this system needs, and no CSP change was required:
- `script-src 'unsafe-inline'` → `next-themes`' pre-paint inline script runs fine.
- `font-src 'self'` → satisfied because `next/font/google` self-hosts at build time. **Never implement a webfont here via a `<link>` to `fonts.googleapis.com`** — it would be CSP-blocked and fall back silently to a system font.

---

## 8. Anti-goals

Enforceable. A design that violates any of these is wrong, not a matter of taste.

1. No cream, sand, beige, bone, linen, paper, parchment, wheat, biscuit, or ivory background anywhere in the sitewide palette.
2. No gradient text (`background-clip: text`). Emphasis is weight and size only.
3. No hero-metric template (big number + small label + gradient accent).
4. No uppercase letterspaced "eyebrow" labels above sections.
5. No 01/02/03 numbered section markers as decoration.
6. No glassmorphism, no `backdrop-blur` on chrome, no glow, no bloom, no neon.
7. No decorative gradients. **One exception**: a legibility scrim over an image is a contrast guarantee, not decoration — the same distinction `.binder-label-scrim` already makes in `globals.css`. The OG image's left-to-right text scrim is permitted on that basis.
8. No side-stripe / left-accent-bar borders. (A hero left accent rule was considered and rejected for exactly this reason.)
9. No second typeface, no synthetic italics, no weight outside {400, 500, 700, 900}.
10. Not costume-y, not juvenile, not chibi — despite the Pokémon and Lego content.
11. No purple-on-purple text below the measured contrast floors in §3.

### The four load-bearing distinctiveness decisions

The palette's headline (purple + dark for a Twitch streamer) is an acknowledged first-order category reflex. Everything that keeps this site from being a generic dark-purple gamer site is carried by four decisions. **None of them are optional polish. If any is dropped for expedience, escalate rather than ship the remainder.**

1. `#F2941C` sourced from Skyler's own Gen VII binder spine — unguessable from the category.
2. The always-dark hero band, persisting through light mode.
3. A single geometric family at weight 900 with zero ornament.
4. The illustrated OG backdrop built from his four actual content pillars.

Second-order check: "streamer site that's deliberately not neon-gamer" would reflex to cream/serif editorial — avoided outright. The nearer trap is that dark-purple + geometric sans is now the crypto/AI-startup house style. The separation is entirely in surface treatment: **flat planes, hard 1px edges, no gradients, no glass, no glow, no soft shadows on chrome.** Add a purple glow or a gradient anywhere and this collapses into that second reflex.

---

## 9. Open-Graph image

`app/opengraph-image.tsx` — a **single static state, theme-independent by design.** Link unfurlers (Discord, X, Twitch panels, iMessage) render server-side with no access to a visitor's preference, and platforms cache the result for days. It is always the dark look, which is precisely why the hero band is also always dark: a visitor who taps the preview lands on the same surface they just saw.

- 1200×630, Node runtime (needs `fs` for the font and backdrop files).
- Text is `siteConfig.brandName` and `siteConfig.tagline` **imported verbatim** from `data/site-config.ts` — never retyped — so the preview cannot drift from the site. Plus a `skylermayday.com` domain line in `--accent`, which is real information rather than decoration.
- **Satori cannot use the `next/font` instance.** Static `LeagueSpartan-Regular.ttf` (400) and `LeagueSpartan-Black.ttf` (900) are committed to the repo (SIL OFL — include the license text) and read as `ArrayBuffer`s. Satori's variable-font support is unreliable; do not rely on synthesised weights.
- Backdrop illustration: 1200×630 (regenerated, not cropped from the 1024×1024 square — a square crop to 1.9:1 decapitates the skyline and centre-weights against a left-aligned layout). **No baked-in text of any kind** — all type is code-rendered. Motifs grouped in the right ~45%; left 55% stays low-detail. Read from disk → base64 data URI (Satori won't fetch a relative path, and an absolute production URL creates a bootstrap dependency).
- **Fallback, if the illustration isn't available**: flat `#1B0F2E` plane, identical text layout, no backdrop, no scrim. On-brand and ship-able. The backdrop `<img>` and scrim are a single conditional block, enabled later by dropping the file in — not a separate component.
- `metadata.openGraph.images` must **not** also be set in `app/layout.tsx` once the file convention exists; the file convention is the single source.
- **Shipped state (Stage 2)**: the type-only fallback — the illustrated backdrop is still not in the repo. Fonts are committed at `assets/fonts/LeagueSpartan-{Regular,Black}.ttf` (statically instanced from the Google Fonts variable source via `fonttools`' `varLib.instancer`, since Google Fonts only distributes League Spartan as a single variable `.ttf` and Satori needs static per-weight files), with `assets/fonts/LeagueSpartan-OFL.txt` alongside. `app/twitter-image.tsx` re-exports the same generator (with its own direct `runtime` export, since Next's route-segment config doesn't resolve through a re-export) so `twitter:image` is guaranteed present without a post-deploy check.

Full composition spec, contrast figures, and asset requirements: `.pipeline/design-brief.md` §7.

---

## 10. Subsystem boundaries

| Subsystem | Owner doc | Status |
|---|---|---|
| Sitewide brand tokens (§3–§6) | this file | Live, extend here |
| PTCG bookshelf wood material (`--wood-*`, `--grain`, `--binder-*`) | `.pipeline/archive-bookshelf-v8-slim-carcase/design-brief.md` | **Frozen.** Values must not change. Selectors follow the sitewide theming mechanism (§7.1). |
| Per-generation spine palette (`sectionSpineColors.ts`) | `docs/ptcg-binders-redesign-spec.md` | **Frozen.** Derived from real game box art. Sitewide `--accent` copies one value by literal, never by import. |
| Card-zoom lightbox | `docs/ptcg-card-zoom-spec.md` | Theme-independent by design (a lightbox is dark in both modes). No `.dark` override needed. |

### 10.1 What "frozen" means for `components/binders/*` (settled iteration 3)

A freeze clause written as a **folder path** broke twice on this project. It is now written as an **invariant**, per design-brief.md §5.6's amendment, and this is the version to carry forward:

**Frozen — never change:** every `--wood-*` / `--grain` / `--binder-*` value, `sectionSpineColors.ts`, the `.binder-cabinet` / `.binder-top-face` / `.binder-contact-shadow` / `.binder-label-scrim` rules, the square corners, the spine and cabinet geometry. Eight documented design iterations sit behind these.

**Not frozen — these were the pre-rebrand *global default* sitting in a folder, never a binder design decision:** raw Tailwind utilities identical to the ones this rebrand retokened everywhere else. Retokened in iteration 3: `text-neutral-500 dark:text-neutral-400` → `text-fg-muted` (3 files), `text-lg font-semibold` on `<h2>` → §4.4's H2 row (2 files), `bg-emerald-500` → `bg-success` (2 files), `focus-visible:outline-blue-{500,600}` → `outline-brand` (2 files).

**The discriminator**: *was this value chosen to make the bookshelf look like wood?* If yes, frozen. If it is the same raw utility that appeared in the 26 other files this rebrand already touched, it isn't.

**Why it matters, stated once so it isn't re-litigated:** freezing an *input* while changing what it composites *against* does not preserve a subsystem's rendered behaviour — it silently degrades it. `#737373` was a 4.74:1 **pass** on the pre-rebrand `#ffffff` page. Nobody edited that file, and it became a 4.43:1 **fail** the moment `--bg` moved to `#F7F7F8`. **§5.6 protects the rendered result, not the token strings.**

**Deliberately still frozen and still there** — flagged rather than fixed, because they *are* design decisions or sit behind a committed baseline:
- `BinderBookcase.tsx:89`'s empty-shelf message keeps `text-neutral-500 dark:text-neutral-400`. It sits on `.binder-cabinet`'s own `bg-neutral-50`, not the page background, measures **4.54:1** (passes), and is inside the committed Playwright visual baseline.
- Three `font-semibold` (weight 600) occurrences remain: `BinderSectionSpine.tsx:157` (the spine's own label, part of the designed spine and inside the screenshot region), `CardSlot.tsx:36`, `CardZoomModal.tsx:163`. None is a heading. They are a real, open exception to anti-goal 9 and should be a deliberate call by Skyler, not an implementer's.
- `border-neutral-{200,300,700,800}` / `bg-neutral-{50,100,900}` throughout the folder. In the amendment's in-scope list, but not named in the verdict's fix list, and retokening the cabinet's own faces would churn all six visual baselines for no measured gain.

**The 26 `text-neutral-500 dark:text-neutral-400` occurrences under `app/projects/stream-analyser/`** are a different exclusion entirely: Stream Analyser was out of scope for the whole rebrand, not frozen. It is the largest remaining un-retokened surface on the site and is the obvious next design run.

---

## 11. Decisions log

| Date | Decision | Why | Status |
|---|---|---|---|
| 2026-07-31 | Established this file; first design system for the project | No sitewide palette or typeface had ever existed — only scaffold defaults plus two isolated subsystems | Shipped |
| 2026-07-31 | League Spartan sitewide, single family, weight-driven | RISK 1 — see §4.2 | Shipped |
| 2026-07-31 | `#9146FF` as brand anchor | SAFE — Twitch platform continuity; acknowledged category reflex (§3.4, §8) | Shipped |
| 2026-07-31 | `#F2941C` (Gen VII spine) as sitewide accent | RISK 3 — see §3.4 | Shipped |
| 2026-07-31 | Always-dark hero band in both themes | RISK 2 — see §3.4; forced by the accent's 2.17:1 on light | Shipped |
| 2026-07-31 | Removed the header's `backdrop-blur` for an opaque plane | RISK 4 — glassmorphism-as-default is a banned tell, and translucency over a tinted bg is worse here | Shipped |
| 2026-07-31 | Class-based dark mode via `next-themes`; wood tokens' selectors converted, values untouched | §7.1 — the alternative ships a visible bug on `/projects/ptcg-binders` | Shipped, verified live (Finding B scenario) |
| 2026-07-31 | `font-mono` stays on the system stack; Geist and Geist Mono both removed | Mono is a utility role, not a hierarchy typeface; Geist was loaded-but-never-applied (§7.3) | Shipped |
| 2026-07-31 | Light-mode background `#F7F7F8`, chroma ≈0 cool | Cream/sand/beige band banned as the 2026 AI default (§3.4) | Shipped |
| 2026-07-31 | ~~No `--success` token~~ | ~~No surface needs one~~ | **Reversed 2026-08-01** — the premise was factually wrong; `/projects` has had a bot status dot all along. See the row below. |
| 2026-08-01 | `--success: #1F8A5F` defined (Generation III spine, own literal) | Closes the Stage 4 verdict's §7 item 4. Fill-only: 4.04:1 light / 4.50:1 dark clears the 3:1 non-text floor for a status dot, not the 4.5:1 text floor. See §3.4's Semantic-Token Derivation Rationale. | Shipped |
| 2026-08-01 | `--danger-soft: #E995A0` defined (derived from `--danger` at fixed hue, L 46.3%→75%) | `--danger` is only 3.44:1 on the dark `--bg`, so retokening the contact form's error text onto it would have regressed dark mode. Mirrors `--brand`/`--brand-soft`. 8.62:1 dark. | Shipped |
| 2026-08-01 | `--accent` given one concrete home: `ContentCard`'s duration chip | RISK 3 was untraceable — the token was consumed zero times in any rendered component. Chosen for being a real live/hype content signal on a permanently dark carrier. Measured 5.59:1 worst case in a real browser. Deliberately not spread further. See §3.5. | Shipped |
| 2026-08-01 | `.prose-block` class replaces per-page 17/1.65/68ch utilities | RISK 1's mitigation is mandatory and was missed on `/about`, the page the brief names as the risk case. A mitigation remembered per page gets forgotten per page. See §4.3. | Shipped |
| 2026-08-01 | Retokened the ~21 remaining in-scope files; eliminated all 13 `font-semibold` (600) and 1 `font-extrabold` (800) | Anti-goal 9 caps weights at {400,500,700,900}. Two of the 600s were inside files the first pass reported as retokened — that pass was colour-aware but not weight-aware. | Shipped |
| 2026-08-01 | `bg-indigo-600` Discord CTA → `bg-brand`; violet/emerald `ProjectBadge` → `--brand` tint / `--border` | Indigo and violet are near-misses against `#9146FF`; a nearly-right colour reads as a mistake, and both sat metres from the real brand purple on `/projects`. | Shipped |
| 2026-08-01 | Skip-to-content link added (`.skip-link` + `id="main"`) | Nielsen heuristic 7 scored 2/4 partly for its absence; a sticky header with five nav links makes every keyboard user re-traverse six stops per route. Written as a plain class because `not-sr-only` zeroes padding. See §5.3. | Shipped |
| 2026-08-01 | Mobile nav active route gains the desktop brand underline | Same nav, two indication methods, and the mobile one (colour alone) was the accessibility-weaker. | Shipped |
| 2026-08-01 | Both `loading.tsx` skeletons retokened to `bg-border` + the 64/96 rhythm | §6.2 named loading states as must-re-verify; they were still on `neutral-200/800` and read as leftover chrome from the old system. | Shipped |
| 2026-07-31 | Font variable className moved from `<body>` to `<html>` in `app/layout.tsx` | Tailwind v4 Preflight scopes `font-family` to `html`/`:host`; a variable class on `<body>` is invisible to a `var()` resolved at `<html>` — found live via computed-style check, not anticipated in the original brief. See §7.3. | Shipped |
| 2026-07-31 | `--fg-muted-hero: #C9C0D8` added as a named token | Brief §5.4 named this hex for `heroBlurb` but didn't give it a token; promoted from an inline arbitrary value per Phase 3's token discipline | Shipped |
| 2026-07-31 | `next-themes@^0.4.6` added as a new dependency | Brief §5.1/§6.1 explicitly specifies it; zero transitive dependencies, small, industry-standard for Next.js class-based theming, handles the `localStorage`-unavailable/no-throw and system-preference-is-initial-only requirements out of the box. Dependency-management skill's new-dependency criteria checked (maintenance health, surface area, replaceability, trust, cost) — see `.pipeline/design-changes.md`. | Shipped |
| 2026-07-31 | `app/twitter-image.tsx` added proactively, re-exporting `app/opengraph-image.tsx`'s generator (with its own direct `runtime = "nodejs"` export — Next's route-segment config isn't statically analyzable through a re-export) | Brief §5.1 flagged `twitter:image` emission as "verify after deploy, add this file if missing"; shipping the safe superset now rather than leaving a post-deploy verify-and-patch step pending. Confirmed present in the production build's HTML (`<meta name="twitter:image">`). | Shipped |

| 2026-08-04 | **State-dimming rule written down (§5.4)**: dim the surface and the imagery, never the text | Three unrelated components each composited their own text below AA through a container `opacity`/`filter` (4.12:1, 2.82:1, 2.53:1). Three instances in three files is a missing convention, not three typos — a fourth would have been authored next quarter. | Shipped |
| 2026-08-04 | `ProjectCard` muted: `opacity-75` → `bg-surface/75`; the false "text colors stay at normal contrast" comment deleted | §5.4. The comment asserted AA-legibility that was untrue, which is worse than no comment — it stops the next reader checking. | Shipped |
| 2026-08-04 | `ShopCard` sold: `opacity-60 grayscale` moved off the container onto the `<Image>`/`<Placeholder>` | §5.4, plus a semantic repair: `grayscale` was filtering the `--danger` "Sold" chip into a neutral grey pill, deleting the meaning that token was introduced to carry. | Shipped |
| 2026-08-04 | `ContactForm` submit: `disabled:opacity-60` removed entirely | §5.4. Pending is "busy", not "invalid" — a control showing "Sending…" should be the most legible thing on the form, not the least (was 2.53:1). | Shipped |
| 2026-08-04 | `<main id="main">` gains `tabIndex={-1}` | The skip link added in iteration 2 moved visual scroll but not accessibility-tree focus (WCAG 2.4.1) — i.e. it worked for exactly the users who needed it least. §5.3. | Shipped |
| 2026-08-04 | `sr-only` `<h2>` added above `/shop`'s and `/content`'s card grids | Both jumped h1 → h3 (axe `heading-order`). Pre-existing, cheap, files already open. §5.3. | Shipped |
| 2026-08-04 | `ProjectBadge`'s two variants given matched fill luminance **and** matched text contrast | Peers that rank equally must look equal; the pale/heavy split implied a hierarchy that doesn't exist, and compounded the `ProjectCard` failure by putting the already-pale variant inside the dimmed card. §5.5. | Shipped |
| 2026-08-04 | `components/binders/*` brought onto the sitewide type scale, focus ring, and `--success`, under design-brief.md §5.6's values-and-mechanism amendment | A freeze written as a folder path cannot express "protect the rendered result, not the token strings" — and the folder-shaped clause is the one that broke, twice. §10.1 records the invariant version and everything deliberately left frozen. | Shipped |

All rows above are now implemented on `main` as of this run. Full file-by-file account, the 7-check verification results, and the pending post-deploy follow-up (visual regression re-baseline): `.pipeline/design-changes.md`.

**Note on the visual-regression baselines.** `npm run test:visual:update` is still *correctly* not run. `playwright.config.ts` targets `baseURL: https://skylermayday.com` with no `webServer` block, so running it before deploy would re-baseline the six committed PNGs against the *old* live site. It is a genuine post-deploy step, and iteration 2 widened its expected diff: the binder pages' `py-10` → `py-16 sm:py-24` and the new h1 scale both change layout inside the screenshotted region, on top of iteration 1's League Spartan re-render. All six diffs are expected and should be reviewed by eye, not treated as regressions.

**Iteration 3 added nothing to that diff**, which was a design constraint on the fix rather than luck. The spec screenshots `.binder-cabinet` and asserts `binder-cabinet-empty`, so: `BinderBookcase`'s retokened `<h2>` sits *outside* the screenshotted element; `BinderSectionSpine`'s `bg-success` gauge and `--brand` focus ring are on spines that never render in an empty cabinet; focus rings don't paint in an unfocused screenshot at all; and the one class string inside the cabinet — `BinderBookcase.tsx:89`'s empty-shelf message — was left untouched by explicit carve-out. Still six expected diffs, not seven.
