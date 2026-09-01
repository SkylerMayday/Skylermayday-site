# skylermayday-site — Claude Code Instructions

**This is the live code repo for skylermayday.com**, and as of 2026-09-01 it also holds the project's planning docs. Next.js 15 (App Router) + TypeScript + Tailwind CSS v4, deployed on Vercel.

## ⚠️ This repo is PUBLIC

Anything committed here is world-readable, permanently, via git history. Before adding a file, ask whether it should be public.

**`gaps.md` is gitignored on purpose** — it holds internal security-assessment notes that must not be published. Keep it local. Do not `git add -f` it, and do not quote its security content into any tracked file.

## Session start

Read these three, then **report what needs to be done**:

| File | Holds |
|---|---|
| [project-overview.md](project-overview.md) | What this is, how it's architected, why the big decisions were made |
| [handoff.md](handoff.md) | Where the last session left off, next steps |
| `gaps.md` | Standing weakness register — **local only, gitignored** |

Update all three at session end / `wrapcon`. Spec: `~/.claude/rules/project-files.md`.

Feature specs live in `docs/` — read the relevant one before changing behaviour:
`website-spec.md` (full requirements), `projects-page-spec.md`, `stream-analyser-port-spec.md`, `ptcg-binders-redesign-spec.md`, `ptcg-second-bookshelf-spec.md`, `ptcg-card-zoom-spec.md`, `ptcg-card-lock-language-remarks-spec.md`, `discord-card-about-copy-spec.md`, `component-testing.md`.

## Push policy — read this first

**A push triggers a live Vercel deploy that Skyler inspects to give feedback. Push automatically after every commit — do not ask.** Withholding the push does not add safety, it blocks him from seeing what changed. (`~/.claude/rules/lessons/auto-push-live-deploy-projects.md`)

Then **stop** — do not poll for the deploy and do not screenshot the live result unless asked. Just confirm the push. (`~/.claude/rules/lessons/poll-only-with-known-timing.md`)

Still ask first for genuinely destructive git operations: force-push, branch deletion, history rewrites.

## Commands

```bash
npm run dev                  # local dev server
npm run build                # production build
npm run lint                 # eslint
npm run test                 # Vitest: unit (node) + components (jsdom), one command
npm run test:visual          # Playwright visual regression
npm run test:visual:install  # once, before the first visual run
```

`npm run test` runs two Vitest projects from one config — `unit` (`**/*.test.ts`) and `components` (`**/*.test.tsx`, jsdom + React Testing Library). See `docs/component-testing.md`.

## Sharp edges

- **Stream Analyser is a page of this site, not an external tool.** It was ported off its own Railway deployment and lives at `/projects/stream-analyser` (`app/projects/stream-analyser/`) with API routes under `app/api/stream-analyser/`. There is no `/tools` route any more, and `D:\Claude Projects\StreamAnalyser` is an empty shell.
- Needs `.env.local` (copy from `.env.local.example`) — the dev server will not work without it.
- Sentry is wired at four levels (`instrumentation.ts`, `instrumentation-client.ts`, `sentry.edge.config.ts`, `sentry.server.config.ts`). Errors surface in Sentry, not just the console.
- Visual regression snapshots need `test:visual:install` once before they will run.
- `DESIGN.md` carries the design system; follow it rather than inventing new tokens.
- QA/design reference screenshots from past sessions live in the sibling `..\SkylerMaydaySite` directory, deliberately outside git — 4.9 MB of PNGs that would otherwise bloat history forever.

---

Global rules: `~/.claude/CLAUDE.md`. Coding mandates in its section 9 apply here — `debugging` before any bug fix, `planning` before anything new, `dev-team-pipeline` for non-trivial changes.
