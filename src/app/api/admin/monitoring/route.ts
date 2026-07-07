import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { getQueueStats } from "@/lib/jobs/queue";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  if (user.role !== "ADMIN") return fail("Admin access required", 403);

  const [users, stores, orders, queue, apiLogs, failedJobs] = await Promise.all([
    db.user.count(),
    db.store.count(),
    db.order.count(),
    getQueueStats(),
    db.apiRequestLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 86_400_000) } },
    }),
    db.backgroundJob.findMany({
      where: { status: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const avgApi =
    (
      await db.apiRequestLog.aggregate({
        _avg: { durationMs: true },
        where: { createdAt: { gte: new Date(Date.now() - 86_400_000) } },
      })
    )._avg.durationMs ?? 0;

  return ok({
    health: "ok",
    users,
    stores,
    orders,
    queue,
    apiRequests24h: apiLogs,
    avgApiDurationMs: Math.round(avgApi),
    failedJobs,
    timestamp: new Date().toISOString(),
  });
});
