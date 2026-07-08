import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { collectionSchema } from "@/lib/validation/seller";
import { uniqueSlug } from "@/lib/seller/slug";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "products");

  const collections = await db.collection.findMany({
    where: { storeId },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return ok({ collections });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "products");

  const data = await parseBody(req, collectionSchema);
  const collection = await db.collection.create({
    data: {
      storeId,
      name: data.name,
      slug: uniqueSlug(data.name),
      description: data.description ?? null,
    },
  });
  return ok({ collection }, { status: 201 });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { storeId } = await params;
  await requireStoreAccess(storeId, "products");

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing collection id", 400);

  const result = await db.collection.deleteMany({ where: { id, storeId } });
  if (result.count === 0) return fail("Collection not found", 404);
  return ok({ deleted: true });
});
