import { ok, fail, withErrorHandling } from "@/lib/api";
import { db } from "@/lib/db";
import { APP_VERSION } from "@/lib/config";
import { getQueueStats } from "@/lib/jobs/queue";

/** Readiness probe — can serve traffic (DB reachable). */
export const GET = withErrorHandling(async () => {
  try {
    await db.$queryRaw`SELECT 1`;
    const queue = await getQueueStats();
    return ok({
      status: "ready",
      version: APP_VERSION,
      database: "connected",
      queue,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Database unavailable",
      503
    );
  }
});
