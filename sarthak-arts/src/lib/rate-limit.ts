/**
 * Lightweight in-memory rate limiter — a first line of defence against brute
 * force and form spam (fixed window per key).
 *
 * IMPORTANT (serverless): this state lives in one server instance's memory, so
 * on Vercel it protects within a warm instance but is NOT shared across
 * instances or cold starts. For production-grade, distributed limiting, back
 * this with Upstash Redis (or Vercel's built-in protections). bcrypt's cost on
 * each login attempt already slows credential guessing meaningfully.
 */
type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();
let lastSweep = 0;

export type RateResult = { ok: boolean; retryAfterSec: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();

  // Opportunistic cleanup so the map can't grow unbounded.
  if (now - lastSweep > 60_000) {
    for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
    lastSweep = now;
  }

  const b = store.get(key);
  if (!b || b.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  b.count++;
  if (b.count > limit) return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  return { ok: true, retryAfterSec: 0 };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
