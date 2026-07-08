import { db } from "@/lib/db";
import { REVENUE_STATUSES } from "@/lib/constants";
import { getQueueStats } from "@/lib/jobs/queue";

const startedAt = Date.now();

export function getUptimeSeconds(): number {
  return Math.floor((Date.now() - startedAt) / 1000);
}

export async function collectBusinessMetrics() {
  const since24h = new Date(Date.now() - 86_400_000);

  const [
    users,
    stores,
    orders24h,
    revenue24h,
    queue,
    apiRequests24h,
    errorLogs24h,
    activeCarts,
  ] = await Promise.all([
    db.user.count(),
    db.store.count(),
    db.order.count({ where: { createdAt: { gte: since24h } } }),
    db.order.aggregate({
      _sum: { totalCents: true },
      where: { createdAt: { gte: since24h }, status: { in: [...REVENUE_STATUSES] } },
    }),
    getQueueStats(),
    db.apiRequestLog.count({ where: { createdAt: { gte: since24h } } }),
    db.systemLog.count({ where: { level: "error", createdAt: { gte: since24h } } }),
    db.cart.count({ where: { status: "ACTIVE" } }),
  ]);

  const avgApi =
    (
      await db.apiRequestLog.aggregate({
        _avg: { durationMs: true },
        where: { createdAt: { gte: since24h } },
      })
    )._avg.durationMs ?? 0;

  return {
    uptimeSeconds: getUptimeSeconds(),
    users,
    stores,
    orders24h,
    revenue24hCents: revenue24h._sum.totalCents ?? 0,
    activeCarts,
    queue,
    apiRequests24h,
    avgApiDurationMs: Math.round(avgApi),
    errorLogs24h,
  };
}
