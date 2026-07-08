import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { uniqueSlug } from "@/lib/seller/slug";

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { storeId, productId } = await params;
  await requireStoreAccess(storeId, "products");

  const source = await db.product.findFirst({
    where: { id: productId, storeId },
    include: { images: true, variants: true },
  });
  if (!source) return fail("Product not found", 404);

  const {
    id: _id,
    createdAt: _c,
    updatedAt: _u,
    slug: _s,
    images,
    variants,
    ...fields
  } = source;

  const copy = await db.product.create({
    data: {
      ...fields,
      name: `${source.name} (copy)`,
      slug: uniqueSlug(source.name),
      status: "DRAFT",
      archivedAt: null,
      images: {
        create: images.map(({ id: _i, productId: _p, ...img }) => img),
      },
      variants: {
        create: variants.map(({ id: _i, productId: _p, ...v }) => v),
      },
    },
    include: { images: true, variants: true },
  });

  return ok({ product: copy }, { status: 201 });
});
