import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { ok, withErrorHandling } from "@/lib/api";
import { APP_VERSION, validateProductionConfig } from "@/lib/config";
import { getUptimeSeconds } from "@/lib/observability/metrics";

/** Liveness probe — process is running. */
export const GET = withErrorHandling(async () => {
  const configCheck = validateProductionConfig();
  return ok({
    status: "ok",
    version: APP_VERSION,
    uptimeSeconds: getUptimeSeconds(),
    configWarnings: configCheck.warnings,
    timestamp: new Date().toISOString(),
  });
});
