/**
 * P1 stub — thin in-memory TTL cache hook.
 *
 * Phase 1 relies on ISR `revalidate` for de-duplication: each ISR window
 * fires the upstream API (Twitch/YouTube) at most once per region, which
 * already covers most of the quota concern without an explicit limiter.
 * See spec §7. This module is intentionally minimal — do not build out a
 * full rate-limiter/cache here until Phase 2 actually needs one on top of
 * ISR (e.g. multi-region fan-out exceeding quota). Wire real usage into
 * `lib/twitch.ts` / `lib/youtube.ts` at that point instead of duplicating
 * revalidate-based de-duplication.
 */

interface CacheEntry<T> {
  value: T;
  expiresAtMs: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAtMs) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAtMs: Date.now() + ttlMs });
}
