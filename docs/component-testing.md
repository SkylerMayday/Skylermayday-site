# Component testing (jsdom + React Testing Library)

How to test a `.tsx` component in this repo, and how the two-environment setup works.

## The two-environment mechanism

`vitest.config.ts` uses Vitest's `test.projects` to run two suites from one `vitest run` (i.e. `npm run test`):

- **`unit`** — `**/*.test.ts`, `node` environment. Pure-function tests (parsers, formatters, rate limiting). No DOM.
- **`components`** — `**/*.test.tsx`, `jsdom` environment, with `vitest.setup.ts` loaded first. Repo-wide on purpose: a `.test.tsx` placed outside `components/` still runs rather than being silently skipped. The two globs can't collide, since `*.test.ts` and `*.test.tsx` are mutually exclusive by extension.

Both run under the single `npm run test` command — no second script. `resolve.alias` (`@/*`) and the root `oxc.jsx` config are inherited by both projects via `extends: true`.

## The pattern

- Co-locate `ComponentName.test.tsx` next to `ComponentName.tsx`.
- Render with `@testing-library/react`'s `render`, `screen`, `fireEvent`; simulate realistic interaction with `@testing-library/user-event` (`userEvent.click`, `.type`, `.tab`, `.keyboard`) rather than raw `fireEvent` where the distinction matters (e.g. keyboard activation of a `<button>`).
- Assert **behavior**, never snapshots (`toMatchSnapshot` is banned in this suite) — query by role/label/text the way a user or screen reader would, and assert on the resulting DOM state, not implementation details.
- If a component reads `next/navigation` router state (e.g. `useSearchParams()`), mock the module at the top of the test file:
  ```ts
  vi.mock("next/navigation", () => ({
    useSearchParams: () => new URLSearchParams(),
  }));
  ```
- `vitest.setup.ts` already provides `@testing-library/jest-dom` matchers (imported via the `/vitest` subpath, since this repo doesn't set `test.globals: true`), an `afterEach(cleanup)` (RTL's own auto-cleanup doesn't register itself without a global `afterEach`), and a query-aware `window.matchMedia` mock.
- The `matchMedia` mock resolves **per media string**, and every query defaults to not-matching. Drive it with `globalThis.__setSystemColorScheme(true | false)` for colour scheme (sets `(prefers-color-scheme: dark)` and its light inverse), or `globalThis.__setMediaQuery(query, matches)` for anything else — e.g. `globalThis.__setMediaQuery("(prefers-reduced-motion: reduce)", true)`. Never assume an unset query reports the colour-scheme value; it doesn't.
- A component that renders via `next/image` or `next/link` needs **no mock** — both work as-is in jsdom, including `fireEvent.error(...)` against the rendered `<img>` (verified across `CardSlot` and `CardZoomModal`). Only reach for a mock if a specific component throws at import/render time under jsdom, and then scope it to that one test file:

  ```tsx
  // Top of the affected .test.tsx only — never in vitest.setup.ts.
  import type { ReactEventHandler } from "react";

  vi.mock("next/image", () => ({
    __esModule: true,
    // Allow-list the real <img> props; next/image-only props (fill, priority,
    // sizes, quality, loader, placeholder) are dropped deliberately, since
    // React warns about them as unknown DOM attributes.
    default: (props: {
      src: string;
      alt: string;
      className?: string;
      onError?: ReactEventHandler<HTMLImageElement>;
    }) => (
      <img
        src={props.src}
        alt={props.alt}
        className={props.className}
        onError={props.onError}
      />
    ),
  }));
  ```

## Worked example

`components/binders/CardSlot.test.tsx` is the best reference: it demonstrates the fixture-factory pattern (a local `slot(...)` mirroring `lib/binders.test.ts`'s), `fireEvent.error(...)` to simulate a broken image load, and focus-management assertions (`document.activeElement`) — without `ThemeToggle`'s extra `matchMedia`-mock complexity.

## Why two of the devDependencies are pinned exact

`@testing-library/react` and `@testing-library/user-event` carry ordinary carets. The other two are pinned without a caret, for one reason each — and the reason differs, so don't copy one justification onto the other:

| Package | Pin | Why |
|---|---|---|
| `@testing-library/jest-dom` | `6.9.1` | Load-bearing. `6.10.0` raised `engines.node` to `>=22`, which this repo's `>=20` floor does not satisfy. A caret would let `npm install` walk straight onto it. |
| `jsdom` | `27.4.0` | Reproducibility only, **not** a Node-compatibility requirement. |

The `jsdom` line was originally documented as "28.x+ requires Node ≥22". That is wrong. Checked against the live registry (2026-08-05):

| jsdom | `engines.node` |
|---|---|
| 27.4.0 | `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` |
| 28.1.0 | `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` (identical to 27.4.0) |
| 29.1.1 | `^20.19.0 \|\| ^22.13.0 \|\| >=24.0.0` (still supports Node 20) |
| 30.0.1 | `^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0` (**first release to drop Node 20**) |

So 28.x and 29.x are both freely available on this repo's Node floor — upgrading is a normal, unblocked maintenance choice, not something the pin is protecting against. Only a jump to 30.x would need the repo's Node floor raised first. Note also that jsdom's real floor is Node **20.19.0**, stricter than `package.json`'s `engines.node: ">=20"` — Node 20.0-20.18 would install but is unsupported by jsdom.
