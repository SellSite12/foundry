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

  const where = { storeId: auth.storeId, status: "PUBLISHED" };
  const [items, total] = await Promise.all([
    db.review.findMany({
      where,
      skip: p.skip,
      take: p.limit,
      orderBy: { createdAt: p.order },
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        authorName: true,
        createdAt: true,
      },
    }),
    db.review.count({ where }),
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
