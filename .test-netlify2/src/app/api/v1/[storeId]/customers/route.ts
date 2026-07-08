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

  const where = {
    storeId: auth.storeId,
    ...(p.q ? { OR: [{ email: { contains: p.q } }, { name: { contains: p.q } }] } : {}),
  };

  const [rows, total] = await Promise.all([
    db.customer.findMany({
      where,
      skip: p.skip,
      take: p.limit,
      orderBy: { createdAt: p.order },
      select: {
        id: true,
        name: true,
        email: true,
        tags: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    db.customer.count({ where }),
  ]);

  const items = rows.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    tags: c.tags,
    orderCount: c._count.orders,
    createdAt: c.createdAt,
  }));

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
