import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { getLiveStore, publicProductWhere, hasPurchased } from "@/lib/shop/storefront";
import { createReviewSchema, updateReviewSchema } from "@/lib/validation/shop";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";

/** Public reviews for a product (?productId=...). */
export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) return fail("Store not found", 404);

  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return fail("Missing productId", 400);

  const reviews = await db.review.findMany({
    where: { storeId: store.id, productId, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      authorName: true,
      rating: true,
      title: true,
      body: true,
      photosJson: true,
      verified: true,
      reply: true,
      createdAt: true,
      userId: true,
    },
  });

  const user = await getCurrentUser();
  return ok({
    reviews: reviews.map((r) => ({
      ...r,
      photos: r.photosJson ? (JSON.parse(r.photosJson) as string[]) : [],
      photosJson: undefined,
      mine: Boolean(user && r.userId === user.id),
      userId: undefined,
    })),
  });
});

/** Submits a review. Logged-in buyers get the "verified purchase" badge. */
export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  rateLimit(req, "reviews", 10, 60_000);
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) return fail("Store not found", 404);

  const data = await parseBody(req, createReviewSchema);
  const user = await getCurrentUser();

  const product = await db.product.findFirst({
    where: { ...publicProductWhere(store.id), id: data.productId },
    select: { id: true, name: true },
  });
  if (!product) return fail("Product not found", 404);

  const authorName = user?.name ?? data.authorName?.trim();
  if (!authorName) return fail("Your name is required", 400, { authorName: "Required" });

  // One review per product per account.
  if (user) {
    const existing = await db.review.findFirst({
      where: { productId: product.id, userId: user.id },
    });
    if (existing) {
      return fail("You've already reviewed this product. Edit your existing review instead.", 409);
    }
  }

  const email = user?.email ?? data.email;
  const customer = email
    ? await db.customer.findUnique({
        where: { storeId_email: { storeId: store.id, email: email.toLowerCase() } },
        select: { id: true },
      })
    : null;

  const verified = user ? await hasPurchased(user.id, product.id) : false;

  const review = await db.review.create({
    data: {
      storeId: store.id,
      productId: product.id,
      customerId: customer?.id ?? null,
      userId: user?.id ?? null,
      authorName,
      rating: data.rating,
      title: data.title ?? null,
      body: data.body,
      photosJson: data.photos?.length ? JSON.stringify(data.photos) : null,
      verified,
      status: "PENDING", // seller moderates before publication
    },
  });

  await createNotification({
    userId: store.ownerId,
    type: "CUSTOMER",
    title: `New ${data.rating}-star review on ${product.name}`,
    body: `${authorName}: "${data.body.slice(0, 80)}${data.body.length > 80 ? "…" : ""}"`,
    href: `/store/${store.id}/reviews`,
  });

  return ok({ review: { id: review.id, status: review.status } }, { status: 201 });
});

/** Author edits their own review (?id=). Re-enters moderation. */
export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) return fail("Store not found", 404);

  const user = await getCurrentUser();
  if (!user) return fail("Sign in to edit your review", 401);

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing review id", 400);

  const review = await db.review.findFirst({
    where: { id, storeId: store.id, userId: user.id },
  });
  if (!review) return fail("Review not found", 404);

  const data = await parseBody(req, updateReviewSchema);
  const updated = await db.review.update({
    where: { id: review.id },
    data: {
      ...(data.rating !== undefined && { rating: data.rating }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.body !== undefined && { body: data.body }),
      ...(data.photos !== undefined && {
        photosJson: data.photos.length ? JSON.stringify(data.photos) : null,
      }),
      status: "PENDING",
    },
  });
  return ok({ review: { id: updated.id, status: updated.status } });
});

/** Author deletes their own review (?id=). */
export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) return fail("Store not found", 404);

  const user = await getCurrentUser();
  if (!user) return fail("Sign in to delete your review", 401);

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing review id", 400);

  const result = await db.review.deleteMany({
    where: { id, storeId: store.id, userId: user.id },
  });
  if (result.count === 0) return fail("Review not found", 404);
  return ok({ deleted: true });
});
