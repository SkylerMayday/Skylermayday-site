import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// RTL's own auto-cleanup only registers itself when it detects a *global*
// `afterEach` — this repo deliberately doesn't set `test.globals: true`
// (existing lib/*.test.ts files import test functions explicitly), so
// auto-cleanup never fires unless done explicitly here. Without this, DOM
// nodes from one test's render() would still be present for the next.
afterEach(() => {
  cleanup();
});

/**
 * jsdom does not implement `window.matchMedia`, and `next-themes` (used by
 * `ThemeToggle`) calls it synchronously on mount to resolve the OS colour
 * scheme. Installed fresh before every test so state never leaks between
 * cases.
 *
 * The mock is **query-aware**: each `MediaQueryList` reports only the state
 * of its own media string, and every query defaults to `false` (i.e. "not
 * matching") until a test says otherwise. That matters — a single shared
 * boolean would make `matchMedia("(prefers-reduced-motion: reduce)")` echo
 * whatever the colour-scheme flag happened to be, so a future
 * reduced-motion test could pass for entirely the wrong reason.
 *
 * Two test-facing controls are exposed on `globalThis`:
 * - `__setSystemColorScheme(matches)` — the common case; sets the dark
 *   query to `matches` and the light query to its inverse, then notifies
 *   the listeners registered on each.
 * - `__setMediaQuery(query, matches)` — the general escape hatch for any
 *   other media feature (reduced motion, contrast, viewport width ...).
 *   Use this rather than widening `__setSystemColorScheme`.
 */
type MediaQueryListener = (event: { matches: boolean }) => void;

declare global {
  var __setSystemColorScheme: (matches: boolean) => void;
  var __setMediaQuery: (query: string, matches: boolean) => void;
}

const PREFERS_COLOR_SCHEME_DARK = "(prefers-color-scheme: dark)";
const PREFERS_COLOR_SCHEME_LIGHT = "(prefers-color-scheme: light)";

/**
 * Media strings are compared as normalised text, not parsed as CSS — enough
 * to make `(prefers-color-scheme:dark)` and `(prefers-color-scheme:  DARK)`
 * resolve to the same entry, which is as much tolerance as this suite needs.
 * Whitespace runs collapse to one space first, then every colon is forced to
 * exactly `": "` — so the spaced and unspaced spellings converge, while
 * genuine separators (`screen and (min-width: 700px)`) stay intact.
 */
function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ").replace(/\s*:\s*/g, ": ");
}

beforeEach(() => {
  // Fresh storage per test — jsdom keeps one window (and thus one
  // localStorage) per test *file*, not per test, so a prior test's stored
  // theme choice would otherwise leak into the next test's "first visit"
  // assertions.
  localStorage.clear();

  // Normalised query -> current match state. Absent means "does not match".
  const matchesByQuery = new Map<string, boolean>();
  // Normalised query -> listeners registered against that exact query.
  const listenersByQuery = new Map<string, Set<MediaQueryListener>>();

  function listenersFor(query: string): Set<MediaQueryListener> {
    let set = listenersByQuery.get(query);
    if (!set) {
      set = new Set<MediaQueryListener>();
      listenersByQuery.set(query, set);
    }
    return set;
  }

  window.matchMedia = ((query: string) => {
    const key = normalizeQuery(query);
    const listeners = listenersFor(key);
    const mql = {
      media: query,
      get matches() {
        return matchesByQuery.get(key) ?? false;
      },
      onchange: null,
      // Legacy API — this is what next-themes@0.4.6 actually calls.
      addListener: (listener: MediaQueryListener) => listeners.add(listener),
      removeListener: (listener: MediaQueryListener) => listeners.delete(listener),
      // Modern API — defensive, in case of a future next-themes upgrade.
      addEventListener: (_type: string, listener: MediaQueryListener) => listeners.add(listener),
      removeEventListener: (_type: string, listener: MediaQueryListener) =>
        listeners.delete(listener),
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;
    return mql;
  }) as typeof window.matchMedia;

  function setMediaQuery(query: string, matches: boolean) {
    const key = normalizeQuery(query);
    matchesByQuery.set(key, matches);
    for (const listener of listenersFor(key)) listener({ matches });
  }

  globalThis.__setMediaQuery = setMediaQuery;
  globalThis.__setSystemColorScheme = (matches: boolean) => {
    setMediaQuery(PREFERS_COLOR_SCHEME_DARK, matches);
    setMediaQuery(PREFERS_COLOR_SCHEME_LIGHT, !matches);
  };
});