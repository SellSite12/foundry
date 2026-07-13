import { NextRequest } from "next/server";

import { ok, withErrorHandling } from "@/lib/api";
import { authenticateBearer, logApiRequest } from "@/lib/api/bearer";
import { getAdvancedMetrics } from "@/lib/seller/advanced-metrics";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const start = Date.now();
  const { storeId } = await params;
  const auth = await authenticateBearer(req, storeId);
  const range = (req.nextUrl.searchParams.get("range") ?? "30d") as "7d" | "30d" | "90d" | "365d";

  const metrics = await getAdvancedMetrics(auth.storeId, range);
  const res = ok({ range, metrics });
  void logApiRequest({
    storeId,
    apiKeyId: auth.apiKeyId,
    method: "GET",
    path: req.nextUrl.pathname,
    statusCode: 200,
    durationMs: Date.now() - start,
  });
  return res;
});
