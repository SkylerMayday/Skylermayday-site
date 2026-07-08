import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, __resetRateLimitStore } from "@/lib/rate-limit";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 10;

describe("checkRateLimit", () => {
  beforeEach(() => {
    __resetRateLimitStore();
  });

  it("allows the first request and starts a fresh window", () => {
    const now = 1_000_000;
    const result = checkRateLimit("1.1.1.1", now);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(MAX_REQUESTS - 1);
    expect(result.limit).toBe(MAX_REQUESTS);
    expect(result.resetAtMs).toBe(now + WINDOW_MS);
    expect(result.retryAfterSeconds).toBe(0);
  });

  it("allows exactly MAX_REQUESTS within a window, then denies the next", () => {
    const now = 1_000_000;
    const key = "2.2.2.2";
    for (let i = 0; i < MAX_REQUESTS; i++) {
      const r = checkRateLimit(key, now + i);
      expect(r.allowed).toBe(true);
    }
    const denied = checkRateLimit(key, now + MAX_REQUESTS);
    expect(denied.allowed).toBe(false);
    expect(denied.remaining).toBe(0);
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("does not increment count on a denied request (window not extended)", () => {
    const now = 1_000_000;
    const key = "3.3.3.3";
    for (let i = 0; i < MAX_REQUESTS; i++) {
      checkRateLimit(key, now + i);
    }
    const firstDeny = checkRateLimit(key, now + MAX_REQUESTS);
    const secondDeny = checkRateLimit(key, now + MAX_REQUESTS + 1);
    // resetAtMs must be identical across repeated denials — proof the
    // window start was never touched by a denied attempt.
    expect(secondDeny.resetAtMs).toBe(firstDeny.resetAtMs);
    expect(secondDeny.allowed).toBe(false);
  });

  it("starts a new window once WINDOW_MS has elapsed, resetting the count", () => {
    const now = 1_000_000;
    const key = "4.4.4.4";
    for (let i = 0; i < MAX_REQUESTS; i++) {
      checkRateLimit(key, now + i);
    }
    expect(checkRateLimit(key, now + MAX_REQUESTS).allowed).toBe(false);

    const afterWindow = now + WINDOW_MS + 1;
    const result = checkRateLimit(key, afterWindow);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(MAX_REQUESTS - 1);
    expect(result.resetAtMs).toBe(afterWindow + WINDOW_MS);
  });

  it("tracks distinct keys independently", () => {
    const now = 1_000_000;
    for (let i = 0; i < MAX_REQUESTS; i++) {
      checkRateLimit("5.5.5.5", now + i);
    }
    expect(checkRateLimit("5.5.5.5", now + MAX_REQUESTS).allowed).toBe(false);
    // A different key must still have its own full quota.
    expect(checkRateLimit("6.6.6.6", now + MAX_REQUESTS).allowed).toBe(true);
  });

  it("evicts oldest entries once MAX_TRACKED_KEYS is reached", () => {
    const now = 1_000_000;
    const MAX_TRACKED_KEYS = 10_000;

    // Fill to the cap with distinct, non-expired keys at increasing
    // windowStartMs so eviction order is deterministic (oldest first).
    for (let i = 0; i < MAX_TRACKED_KEYS; i++) {
      checkRateLimit(`key-${i}`, now + i);
    }

    // One more distinct key should trigger the eviction guard rather than
    // growing the store past the cap.
    const triggerResult = checkRateLimit("key-overflow", now + MAX_TRACKED_KEYS);
    expect(triggerResult.allowed).toBe(true);

    // The very oldest key (key-0, smallest windowStartMs) should have been
    // evicted, so it gets a fresh window instead of being denied.
    const oldestKeyResult = checkRateLimit("key-0", now + MAX_TRACKED_KEYS + 1);
    expect(oldestKeyResult.allowed).toBe(true);
    expect(oldestKeyResult.remaining).toBe(MAX_REQUESTS - 1);
  }, 20_000);
});
