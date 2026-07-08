import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, withErrorHandling, ApiError } from "@/lib/api";
import { authenticateBearer, logApiRequest } from "@/lib/api/bearer";
import { parsePagination, paginated } from "@/lib/api/v1";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const start = Date.now();
  const { storeId } = await params;
  try {
    const auth = await authenticateBearer(req, storeId);
    const p = parsePagination(req);
    const where = {
      storeId: auth.storeId,
      ...(p.q ? { OR: [{ name: { contains: p.q } }, { sku: { contains: p.q } }] } : {}),
    };
    const [items, total] = await Promise.all([
      db.product.findMany({
        where,
        skip: p.skip,
        take: p.limit,
        orderBy: { createdAt: p.order },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          priceCents: true,
          stock: true,
          sku: true,
          createdAt: true,
        },
      }),
      db.product.count({ where }),
    ]);
    const res = ok(paginated(items, total, p));
    void logApiRequest({
      storeId,
      apiKeyId: auth.apiKeyId,
      method: req.method,
      path: req.nextUrl.pathname,
      statusCode: res.status,
      durationMs: Date.now() - start,
    });
    return res;
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    void logApiRequest({
      storeId,
      method: req.method,
      path: req.nextUrl.pathname,
      statusCode: status,
      durationMs: Date.now() - start,
    });
    throw error;
  }
});
