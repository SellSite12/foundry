import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { updateProductSchema } from "@/lib/validation/seller";

async function findProduct(storeId: string, productId: string) {
  return db.product.findFirst({
    where: { id: productId, storeId },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { position: "asc" } },
      collection: true,
    },
  });
}

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId, productId } = await params;
  await requireStoreAccess(storeId, "products");

  const product = await findProduct(storeId, productId);
  if (!product) return fail("Product not found", 404);
  return ok({ product });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId, productId } = await params;
  await requireStoreAccess(storeId, "products");

  const existing = await db.product.findFirst({ where: { id: productId, storeId } });
  if (!existing) return fail("Product not found", 404);

  const data = await parseBody(req, updateProductSchema);
  const { images, variants, publishAt, status, ...fields } = data;

  await db.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        ...fields,
        ...(publishAt !== undefined && { publishAt: publishAt ? new Date(publishAt) : null }),
        ...(status !== undefined && {
          status,
          archivedAt: status === "ARCHIVED" ? new Date() : null,
        }),
      },
    });

    // Full replace of images keeps ordering logic simple and predictable.
    if (images !== undefined) {
      await tx.productImage.deleteMany({ where: { productId } });
      if (images.length) {
        await tx.productImage.createMany({
          data: images.map((img, i) => ({
            productId,
            url: img.url,
            alt: img.alt ?? null,
            isVideo: img.isVideo ?? false,
            position: img.position ?? i,
          })),
        });
      }
    }

    // Variants: update by id, create new ones, delete the removed.
    if (variants !== undefined) {
      const keepIds = variants.filter((v) => v.id).map((v) => v.id as string);
      await tx.productVariant.deleteMany({
        where: { productId, ...(keepIds.length && { id: { notIn: keepIds } }) },
      });
      for (const [i, v] of variants.entries()) {
        const payload = {
          name: v.name,
          options: JSON.stringify(v.options),
          sku: v.sku ?? null,
          barcode: v.barcode ?? null,
          priceCents: v.priceCents ?? null,
          position: v.position ?? i,
          ...(v.stock !== undefined && { stock: v.stock }),
        };
        if (v.id) {
          await tx.productVariant.updateMany({
            where: { id: v.id, productId },
            data: payload,
          });
        } else {
          await tx.productVariant.create({
            data: { ...payload, productId, stock: v.stock ?? 0 },
          });
        }
      }
    }
  });

  const product = await findProduct(storeId, productId);
  return ok({ product });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { storeId, productId } = await params;
  await requireStoreAccess(storeId, "products");

  const existing = await db.product.findFirst({
    where: { id: productId, storeId },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!existing) return fail("Product not found", 404);

  // Products referenced by orders must be archived, not deleted, so order
  // history stays intact.
  if (existing._count.orderItems > 0) {
    await db.product.update({
      where: { id: productId },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    });
    return ok({
      archived: true,
      message: "This product has orders, so it was archived instead of deleted.",
    });
  }

  await db.product.delete({ where: { id: productId } });
  return ok({ deleted: true });
});
