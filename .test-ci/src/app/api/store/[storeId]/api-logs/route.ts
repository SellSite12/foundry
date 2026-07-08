import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "developer");

  const since = new Date(Date.now() - 86_400_000);
  const [logs, total, keys] = await Promise.all([
    db.apiRequestLog.findMany({
      where: { storeId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.apiRequestLog.count({ where: { storeId, createdAt: { gte: since } } }),
    db.apiKey.findMany({ where: { storeId, revokedAt: null }, select: { id: true, name: true } }),
  ]);

  return ok({
    logs,
    total24h: total,
    rateLimit: 120,
    usagePct: Math.min(100, Math.round((total / 120) * 100)),
    keys,
  });
});
