import { describe, it, expect } from "vitest";

/**
 * Regression guard for vitest.setup.ts's matchMedia mock — proves it's
 * genuinely query-aware, not a single shared boolean. Without this, a
 * future test checking `(prefers-reduced-motion: reduce)` could pass for
 * the wrong reason (echoing whatever the colour-scheme flag happened to
 * be), and nothing would catch a regression back to the old shared-state
 * shape. See gaps.md, 2026-08-05.
 */
describe("matchMedia mock (vitest.setup.ts)", () => {
  it("tracks color-scheme and an unrelated query independently", () => {
    globalThis.__setSystemColorScheme(true);
    globalThis.__setMediaQuery("(prefers-reduced-motion: reduce)", true);

    expect(window.matchMedia("(prefers-color-scheme: dark)").matches).toBe(true);
    expect(window.matchMedia("(prefers-color-scheme: light)").matches).toBe(false);
    expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);

    // The regression this guards against: color-scheme flipping must not
    // touch an unrelated query's state.
    globalThis.__setSystemColorScheme(false);
    expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
  });

  it("defaults an unset query to not-matching, not to the color-scheme flag", () => {
    globalThis.__setSystemColorScheme(true);
    expect(window.matchMedia("(min-width: 700px)").matches).toBe(false);
  });

  it("notifies listeners registered on one query when only that query changes", () => {
    const seen: boolean[] = [];
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    mql.addListener(({ matches }) => seen.push(matches));

    globalThis.__setSystemColorScheme(true); // unrelated query — must not fire
    globalThis.__setMediaQuery("(prefers-reduced-motion: reduce)", true);

    expect(seen).toEqual([true]);
  });
});
