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
 *
 * `maxRequests` defaults to the site-wide MAX_REQUESTS (10/hr, the contact-form
 * precedent) but callers may override it per-bucket — e.g. the Stream Analyser
 * proxy routes use a namespaced key with a looser ceiling (see
 * SA_PROXY_RATE_LIMIT in lib/stream-analyser/allowed-domains.ts) because a
 * single analysis fans out to ~15 audio-segment fetches, which 10/hr can't
 * accommodate.
 */
export function checkRateLimit(
  key: string,
  nowMs: number = Date.now(),
  maxRequests: number = MAX_REQUESTS
): RateLimitResult {
  enforceCap(nowMs);

  const entry = buckets.get(key);

  if (!entry || nowMs - entry.windowStartMs >= WINDOW_MS) {
    // No entry, or the previous window has elapsed — start a fresh window.
    buckets.set(key, { count: 1, windowStartMs: nowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      limit: maxRequests,
      resetAtMs: nowMs + WINDOW_MS,
      retryAfterSeconds: 0,
    };
  }

  const resetAtMs = entry.windowStartMs + WINDOW_MS;

  if (entry.count >= maxRequests) {
    // Denied. Do not increment — the window must not be extended by
    // repeated denied attempts, so it genuinely expires on schedule.
    return {
      allowed: false,
      remaining: 0,
      limit: maxRequests,
      resetAtMs,
      retryAfterSeconds: Math.ceil((resetAtMs - nowMs) / 1000),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    limit: maxRequests,
    resetAtMs,
    retryAfterSeconds: 0,
  };
}

/** Test-only: clears all buckets. Not called by production code. */
export function __resetRateLimitStore(): void {
  buckets.clear();
}

/**
 * Vercel populates `x-forwarded-for` on serverless requests; the client IP
 * is the first entry in that comma-separated list (Vercel prepends the real
 * client IP; downstream proxies append). Vercel does not expose `request.ip`
 * on the standard `Request` in a route handler, and `x-real-ip` is also set
 * by Vercel as a single value — use it as a fallback.
 *
 * Note on spoofability: `x-forwarded-for` is client-settable in general,
 * but on Vercel the platform overwrites/prepends the true client IP, so
 * trusting the first entry is correct for this deployment target. We do
 * not attempt to defend against a caller who bypasses Vercel's edge — not
 * reachable for a Vercel-hosted site.
 *
 * Single source of truth (extracted from app/api/contact/route.ts so every
 * rate-limited route — contact + the four Stream Analyser routes — shares
 * the same Vercel-correct trust model instead of copy-pasting it).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // First hop is the real client IP on Vercel; trim whitespace.
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  // Last resort: a single shared bucket. Fail toward limiting (shared bucket)
  // rather than failing open per-request, since a missing IP on Vercel is
  // abnormal and we'd rather rate-limit an anomaly than let it bypass.
  return "unknown";
}
