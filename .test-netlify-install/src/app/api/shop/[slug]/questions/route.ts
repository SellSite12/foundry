import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { getLiveStore, publicProductWhere } from "@/lib/shop/storefront";
import { createQuestionSchema } from "@/lib/validation/shop";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";

/** Answered questions for a product (?productId=...). */
export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) return fail("Store not found", 404);

  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) return fail("Missing productId", 400);

  const questions = await db.productQuestion.findMany({
    where: { storeId: store.id, productId, status: "ANSWERED" },
    orderBy: { answeredAt: "desc" },
    take: 50,
    select: { id: true, authorName: true, question: true, answer: true, answeredAt: true },
  });
  return ok({ questions });
});

/** Asks a question about a product; the seller answers from the dashboard. */
export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  rateLimit(req, "questions", 10, 60_000);
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) return fail("Store not found", 404);

  const data = await parseBody(req, createQuestionSchema);
  const user = await getCurrentUser();

  const product = await db.product.findFirst({
    where: { ...publicProductWhere(store.id), id: data.productId },
    select: { id: true, name: true },
  });
  if (!product) return fail("Product not found", 404);

  const authorName = user?.name ?? data.authorName?.trim();
  if (!authorName) return fail("Your name is required", 400, { authorName: "Required" });

  const question = await db.productQuestion.create({
    data: {
      storeId: store.id,
      productId: product.id,
      userId: user?.id ?? null,
      authorName,
      question: data.question,
    },
  });

  await createNotification({
    userId: store.ownerId,
    type: "CUSTOMER",
    title: `New question on ${product.name}`,
    body: data.question.slice(0, 100),
    href: `/store/${store.id}/reviews#questions`,
  });

  return ok({ question: { id: question.id, status: question.status } }, { status: 201 });
});
