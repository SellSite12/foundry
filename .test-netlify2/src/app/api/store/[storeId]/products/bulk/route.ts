import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { bulkProductSchema } from "@/lib/validation/seller";

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "products");

  const { ids, action } = await parseBody(req, bulkProductSchema);
  const where = { id: { in: ids }, storeId }; // storeId scoping prevents cross-store edits

  let affected = 0;
  switch (action) {
    case "PUBLISH": {
      const r = await db.product.updateMany({
        where,
        data: { status: "PUBLISHED", archivedAt: null },
      });
      affected = r.count;
      break;
    }
    case "DRAFT": {
      const r = await db.product.updateMany({
        where,
        data: { status: "DRAFT", archivedAt: null },
      });
      affected = r.count;
      break;
    }
    case "ARCHIVE": {
      const r = await db.product.updateMany({
        where,
        data: { status: "ARCHIVED", archivedAt: new Date() },
      });
      affected = r.count;
      break;
    }
    case "UNARCHIVE": {
      const r = await db.product.updateMany({
        where,
        data: { status: "DRAFT", archivedAt: null },
      });
      affected = r.count;
      break;
    }
    case "DELETE": {
      // Only delete products with no order history; archive the rest.
      const withOrders = await db.orderItem.findMany({
        where: { productId: { in: ids }, order: { storeId } },
        select: { productId: true },
        distinct: ["productId"],
      });
      const protectedIds = new Set(withOrders.map((o) => o.productId));
      const deletable = ids.filter((id) => !protectedIds.has(id));

      const [deleted, archived] = await db.$transaction([
        db.product.deleteMany({ where: { id: { in: deletable }, storeId } }),
        db.product.updateMany({
          where: { id: { in: [...protectedIds] }, storeId },
          data: { status: "ARCHIVED", archivedAt: new Date() },
        }),
      ]);
      affected = deleted.count + archived.count;
      break;
    }
  }

  return ok({ affected });
});
