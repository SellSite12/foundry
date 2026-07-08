import { db } from "@/lib/db";

/**
 * DB-backed sliding window rate limiter. Works without Redis for dev/small scale.
 * For high traffic, swap the backing store to Redis while keeping this interface.
 */
export async function checkRateLimit(key: string, limitPerMinute: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - 60_000);
  const count = await db.apiRequestLog.count({
    where: {
      apiKey: { keyHash: key },
      createdAt: { gte: windowStart },
    },
  }).catch(() => 0);

  // Fallback: use analytics events as a lightweight counter when no apiKey relation match
  if (count === 0) {
    const alt = await db.analyticsEvent.count({
      where: { type: `rate:${key}`, createdAt: { gte: windowStart } },
    });
    if (alt >= limitPerMinute) return false;
    await db.analyticsEvent.create({
      data: { type: `rate:${key}`, payload: JSON.stringify({ ts: Date.now() }) },
    });
    return true;
  }

  return count < limitPerMinute;
}

/** Track rate limit hits by API key id (used by bearer auth). */
const memoryCounts = new Map<string, { count: number; resetAt: number }>();

export function checkMemoryRateLimit(key: string, limitPerMinute: number): boolean {
  const now = Date.now();
  const entry = memoryCounts.get(key);
  if (!entry || now > entry.resetAt) {
    memoryCounts.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= limitPerMinute) return false;
  entry.count++;
  return true;
}
