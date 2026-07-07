import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { wishlistSchema } from "@/lib/validation/shop";
import { ratingSummary } from "@/lib/shop/storefront";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const items = await db.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          visibility: true,
          priceCents: true,
          compareAtCents: true,
          currency: true,
          trackInventory: true,
          stock: true,
          images: { orderBy: { position: "asc" }, take: 1 },
          reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
          store: { select: { name: true, slug: true } },
        },
      },
    },
  });

  return ok({
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      createdAt: i.createdAt,
      name: i.product.name,
      slug: i.product.slug,
      priceCents: i.product.priceCents,
      compareAtCents: i.product.compareAtCents,
      currency: i.product.currency,
      imageUrl: i.product.images[0]?.url ?? null,
      available:
        i.product.status === "PUBLISHED" &&
        i.product.visibility === "VISIBLE" &&
        (!i.product.trackInventory || i.product.stock > 0),
      rating: ratingSummary(i.product.reviews),
      storeName: i.product.store.name,
      storeSlug: i.product.store.slug,
    })),
  });
});

/** Toggles a product on/off the wishlist. */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const data = await parseBody(req, wishlistSchema);

  const product = await db.product.findUnique({
    where: { id: data.productId },
    select: { id: true },
  });
  if (!product) return fail("Product not found", 404);

  const existing = await db.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId: product.id } },
  });
  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
    return ok({ wishlisted: false });
  }
  await db.wishlistItem.create({ data: { userId: user.id, productId: product.id } });
  return ok({ wishlisted: true }, { status: 201 });
});

export const DELETE = withErrorHandling(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing item id", 400);

  const result = await db.wishlistItem.deleteMany({ where: { id, userId: user.id } });
  if (result.count === 0) return fail("Item not found", 404);
  return ok({ deleted: true });
});
