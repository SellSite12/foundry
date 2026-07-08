import { NextRequest } from "next/server";

import { ApiError } from "@/lib/api";

// Fixed-window in-memory rate limiter. Suitable for a single Node process;
// swap for a Redis-backed limiter when deploying multiple instances.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"
  );
}

/**
 * Throws a 429 ApiError when `limit` requests within `windowMs` is exceeded
 * for the given scope + client IP.
 */
export function rateLimit(
  req: NextRequest,
  scope: string,
  limit: number,
  windowMs: number
): void {
  const key = `${scope}:${clientIp(req)}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    throw new ApiError("Too many attempts. Please try again later.", 429);
  }

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }
}
