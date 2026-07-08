/**
 * Fixed-window, per-key in-memory rate limiter (Phase 1 hardening item 2).
 *
 * In-memory, per-instance limiter. On Vercel serverless this state is NOT
 * shared across concurrent instances and is WIPED on cold start. A determined
 * attacker across many cold instances could exceed 10/hr globally. This is an
 * ACCEPTED limitation for a low-traffic personal site (website-spec P1): the
 * goal is casual spam/abuse deterrence, not hard security. Upgrading to a
 * shared store (Upstash/Redis/Vercel KV) is deliberately out of scope for this
 * pass — do NOT add an external dependency or database here.
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 10; // 10 per IP per hour (matches website-spec P1 precedent)
const MAX_TRACKED_KEYS = 10_000; // hard cap on Map size — eviction guard

interface WindowEntry {
  count: number;
  windowStartMs: number; // epoch ms of the current fixed window's start
}

const buckets = new Map<string, WindowEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number; // requests left in current window (>= 0)
  limit: number; // MAX_REQUESTS, for a header if desired
  resetAtMs: number; // epoch ms when the current window ends
  retryAfterSeconds: number; // ceil((resetAtMs - now)/1000); 0 when allowed
}

/**
 * Opportunistic sweep: deletes every entry whose window has already
 * elapsed. Called only when the bucket count reaches the hard cap, so it
 * costs nothing on the common path.
 */
function sweep(nowMs: number): void {
  for (const [key, entry] of buckets) {
    if (nowMs - entry.windowStartMs >= WINDOW_MS) {
      buckets.delete(key);
    }
  }
}

/**
 * Eviction guard: if we're at/over the hard cap, sweep expired entries
 * first. If still at/over the cap afterward (a pathological flood of
 * distinct IPs within a single window), evict the oldest entries by
 * `windowStartMs` until we're back under the cap. Bounds memory absolutely
 * at MAX_TRACKED_KEYS entries (~10k small objects — trivially small).
 */
function enforceCap(nowMs: number): void {
  if (buckets.size < MAX_TRACKED_KEYS) return;

  sweep(nowMs);

  if (buckets.size < MAX_TRACKED_KEYS) return;

  const entries = Array.from(buckets.entries()).sort(
    (a, b) => a[1].windowStartMs - b[1].windowStartMs
  );
  const numberToEvict = buckets.size - MAX_TRACKED_KEYS + 1;
  for (let i = 0; i < numberToEvict; i++) {
    buckets.delete(entries[i][0]);
  }
}

/**
 * Fixed-window rate limit check. Call once per request; it both checks AND
 * records the attempt (i.e. it increments on an allowed call).
 */
export function checkRateLimit(key: string, nowMs: number = Date.now()): RateLimitResult {
  enforceCap(nowMs);

  const entry = buckets.get(key);

  if (!entry || nowMs - entry.windowStartMs >= WINDOW_MS) {
    // No entry, or the previous window has elapsed — start a fresh window.
    buckets.set(key, { count: 1, windowStartMs: nowMs });
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      limit: MAX_REQUESTS,
      resetAtMs: nowMs + WINDOW_MS,
      retryAfterSeconds: 0,
    };
  }

  const resetAtMs = entry.windowStartMs + WINDOW_MS;

  if (entry.count >= MAX_REQUESTS) {
    // Denied. Do not increment — the window must not be extended by
    // repeated denied attempts, so it genuinely expires on schedule.
    return {
      allowed: false,
      remaining: 0,
      limit: MAX_REQUESTS,
      resetAtMs,
      retryAfterSeconds: Math.ceil((resetAtMs - nowMs) / 1000),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count,
    limit: MAX_REQUESTS,
    resetAtMs,
    retryAfterSeconds: 0,
  };
}

/** Test-only: clears all buckets. Not called by production code. */
export function __resetRateLimitStore(): void {
  buckets.clear();
}
