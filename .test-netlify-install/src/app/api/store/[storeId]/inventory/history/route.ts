import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { getPagination, pageMeta } from "@/lib/seller/pagination";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "inventory");

  const productId = req.nextUrl.searchParams.get("productId");
  const { page, take, skip } = getPagination(req);

  const where = { storeId, ...(productId && { productId }) };

  const [total, adjustments] = await Promise.all([
    db.inventoryAdjustment.count({ where }),
    db.inventoryAdjustment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        product: { select: { name: true, sku: true } },
        variant: { select: { name: true } },
      },
    }),
  ]);

  return ok({ adjustments, ...pageMeta(total, page) });
});
