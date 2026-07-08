import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { ok, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "audit");

  const format = req.nextUrl.searchParams.get("format") ?? "json";
  const action = req.nextUrl.searchParams.get("action") ?? undefined;
  const limit = Math.min(500, Number(req.nextUrl.searchParams.get("limit") ?? 100));

  const logs = await db.auditLog.findMany({
    where: {
      storeId,
      ...(action ? { action: { contains: action } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true, email: true } } },
  });

  if (format === "csv") {
    const header = "time,action,user,ip";
    const rows = logs.map(
      (l) =>
        `${l.createdAt.toISOString()},${l.action},${l.user?.email ?? ""},${l.ipAddress ?? ""}`
    );
    return new NextResponse([header, ...rows].join("\n"), {
      headers: {
        "content-type": "text/csv",
        "content-disposition": `attachment; filename="audit-${storeId}.csv"`,
      },
    });
  }

  return ok({
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      userId: l.userId,
      userName: l.user?.name,
      detail: l.detail ? JSON.parse(l.detail) : null,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt,
    })),
  });
});
