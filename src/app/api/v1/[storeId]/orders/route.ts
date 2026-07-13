import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, withErrorHandling } from "@/lib/api";
import { authenticateBearer, logApiRequest } from "@/lib/api/bearer";
import { parsePagination, paginated } from "@/lib/api/v1";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const start = Date.now();
  const { storeId } = await params;
  const auth = await authenticateBearer(req, storeId);
  const p = parsePagination(req);
  const status = req.nextUrl.searchParams.get("status") ?? undefined;

  const qNum = p.q ? parseInt(p.q, 10) : NaN;
  const where = {
    storeId: auth.storeId,
    ...(status ? { status } : {}),
    ...(p.q
      ? {
          OR: [
            ...(Number.isFinite(qNum) ? [{ orderNumber: qNum }] : []),
            { customerEmail: { contains: p.q } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.order.findMany({
      where,
      skip: p.skip,
      take: p.limit,
      orderBy: { createdAt: p.order },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        customerEmail: true,
        createdAt: true,
      },
    }),
    db.order.count({ where }),
  ]);

  const res = ok(paginated(items, total, p));
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
