import { NextRequest } from "next/server";

import { ok, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { getAdvancedMetrics } from "@/lib/seller/advanced-metrics";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "analytics");

  const range = (req.nextUrl.searchParams.get("range") ?? "30d") as "7d" | "30d" | "90d" | "365d";
  const metrics = await getAdvancedMetrics(storeId, range);
  return ok({ range, metrics });
});
