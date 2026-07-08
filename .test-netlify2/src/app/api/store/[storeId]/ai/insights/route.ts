import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { refreshStoreInsights } from "@/lib/ai/insights";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "ai");

  const status = req.nextUrl.searchParams.get("status") ?? "NEW";
  const insights = await db.aiInsight.findMany({
    where: { storeId, status },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 50,
  });
  return ok({ insights });
});

export const POST = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "ai");

  const created = await refreshStoreInsights(storeId);
  return ok({ created });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "ai");

  const id = req.nextUrl.searchParams.get("id");
  const status = req.nextUrl.searchParams.get("status");
  if (!id || !status) return fail("Missing id or status", 400);

  const updated = await db.aiInsight.updateMany({
    where: { id, storeId },
    data: { status },
  });
  if (updated.count === 0) return fail("Insight not found", 404);
  return ok({ updated: true });
});
