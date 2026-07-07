import { NextRequest } from "next/server";

import { ok, fail, withErrorHandling } from "@/lib/api";
import { config } from "@/lib/config";
import { collectBusinessMetrics } from "@/lib/observability/metrics";
import { getRecentLogs } from "@/lib/observability/logger";

function assertMetricsAuth(req: NextRequest) {
  if (!config.isProd) return;
  const secret = config.metricsSecret;
  if (!secret) return;
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) throw new Error("Unauthorized");
}

/** Operational metrics for monitoring dashboards and alerting hooks. */
export const GET = withErrorHandling(async (req: NextRequest) => {
  try {
    assertMetricsAuth(req);
  } catch {
    return fail("Unauthorized", 401);
  }

  const [metrics, recentErrors] = await Promise.all([
    collectBusinessMetrics(),
    getRecentLogs({ level: "error", limit: 20 }),
  ]);

  return ok({
    metrics,
    recentErrors: recentErrors.map((l) => ({
      id: l.id,
      category: l.category,
      message: l.message,
      createdAt: l.createdAt,
    })),
    timestamp: new Date().toISOString(),
  });
});
