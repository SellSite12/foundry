import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { reviewModerateSchema } from "@/lib/validation/seller";
import { getPagination, pageMeta } from "@/lib/seller/pagination";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "reviews");

  const status = req.nextUrl.searchParams.get("status");
  const { page, take, skip } = getPagination(req);

  const where = { storeId, ...(status && { status }) };

  const [total, reviews] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: { product: { select: { name: true, slug: true } } },
    }),
  ]);

  return ok({ reviews, ...pageMeta(total, page) });
});

/** Moderates a review: publish/hide, reply, or report abuse. */
export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "reviews");

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing review id", 400);

  const data = await parseBody(req, reviewModerateSchema);
  const { report, reportNote, ...fields } = data;
  const result = await db.review.updateMany({
    where: { id, storeId },
    data: {
      ...fields,
      ...(report !== undefined && {
        reportedAt: report ? new Date() : null,
        reportNote: report ? (reportNote ?? null) : null,
        ...(report && { status: "HIDDEN" }),
      }),
    },
  });
  if (result.count === 0) return fail("Review not found", 404);

  const review = await db.review.findUnique({ where: { id } });
  return ok({ review });
});
