import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { inventoryAdjustSchema } from "@/lib/validation/seller";
import { getPagination, pageMeta } from "@/lib/seller/pagination";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "inventory");

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const filter = sp.get("filter"); // low | out
  const { page, take, skip } = getPagination(req);

  const where = {
    storeId,
    trackInventory: true,
    status: { not: "ARCHIVED" },
    ...(q && { OR: [{ name: { contains: q } }, { sku: { contains: q } }] }),
  };

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { name: "asc" },
      take,
      skip,
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        reservedStock: true,
        incomingStock: true,
        lowStockThreshold: true,
        warehouseLocation: true,
        variants: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            reservedStock: true,
            incomingStock: true,
          },
        },
      },
    }),
  ]);

  const filtered =
    filter === "low"
      ? products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold)
      : filter === "out"
        ? products.filter((p) => p.stock <= 0)
        : products;

  return ok({ products: filtered, ...pageMeta(total, page) });
});

/** Applies a manual stock adjustment and records it in inventory history. */
export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { store, user } = await requireStoreAccess(storeId, "inventory");
  const data = await parseBody(req, inventoryAdjustSchema);

  const product = await db.product.findFirst({
    where: { id: data.productId, storeId },
  });
  if (!product) return fail("Product not found", 404);

  const result = await db.$transaction(async (tx) => {
    let stockAfter: number;

    if (data.variantId) {
      const variant = await tx.productVariant.findFirst({
        where: { id: data.variantId, productId: product.id },
      });
      if (!variant) throw new Error("VARIANT_NOT_FOUND");
      stockAfter = Math.max(0, variant.stock + data.delta);
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: stockAfter },
      });
    } else {
      stockAfter = Math.max(0, product.stock + data.delta);
      await tx.product.update({
        where: { id: product.id },
        data: { stock: stockAfter },
      });
    }

    const adjustment = await tx.inventoryAdjustment.create({
      data: {
        storeId,
        productId: product.id,
        variantId: data.variantId ?? null,
        delta: data.delta,
        reason: data.reason,
        note: data.note ?? null,
        stockAfter,
        actorName: user.name,
      },
    });

    if (!data.variantId && stockAfter <= product.lowStockThreshold) {
      await tx.notification.create({
        data: {
          userId: store.ownerId,
          type: "INVENTORY",
          title: stockAfter <= 0 ? `Out of stock: ${product.name}` : `Low stock: ${product.name}`,
          body: `${stockAfter} left after ${data.reason.toLowerCase()} adjustment.`,
          href: `/store/${storeId}/inventory`,
        },
      });
    }

    return { adjustment, stockAfter };
  });

  return ok(result, { status: 201 });
});
