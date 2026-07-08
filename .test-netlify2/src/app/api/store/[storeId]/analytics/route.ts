import { NextRequest } from "next/server";

import { ok, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { computeAnalytics, rangeFromKey } from "@/lib/seller/metrics";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "analytics");

  const sp = req.nextUrl.searchParams;
  const range = rangeFromKey(
    sp.get("range") ?? "30d",
    sp.get("from") ?? undefined,
    sp.get("to") ?? undefined
  );

  const analytics = await computeAnalytics(storeId, range);
  return ok({ analytics });
});
