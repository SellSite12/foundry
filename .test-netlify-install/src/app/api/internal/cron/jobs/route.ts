import { ok, withErrorHandling } from "@/lib/api";
import { processJobQueue } from "@/lib/jobs/processor";
import { runScheduledReports } from "@/lib/reports/generate";
import { db } from "@/lib/db";
import { refreshStoreInsights } from "@/lib/ai/insights";
import { purgeOldLogs } from "@/lib/observability/logger";
import { config } from "@/lib/config";

function assertCron(req: Request) {
  const secret = config.cronSecret;
  if (!secret) return;
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) throw new Error("Unauthorized");
}

export const POST = withErrorHandling(async (req) => {
  assertCron(req);
  const jobs = await processJobQueue(25);
  const reports = await runScheduledReports();
  const logsPurged = await purgeOldLogs();

  const stores = await db.store.findMany({ select: { id: true }, take: 50 });
  let insights = 0;
  for (const s of stores) {
    insights += await refreshStoreInsights(s.id);
  }

  return ok({ jobs, reports, insightsRefreshed: insights, logsPurged });
});
