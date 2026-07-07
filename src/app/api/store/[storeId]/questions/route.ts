import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { answerQuestionSchema } from "@/lib/validation/shop";

/** Product Q&A moderation queue for the seller dashboard. */
export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "reviews");

  const status = req.nextUrl.searchParams.get("status");
  const questions = await db.productQuestion.findMany({
    where: { storeId, ...(status && { status }) },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { product: { select: { id: true, name: true } } },
  });
  return ok({ questions });
});

/** Answers, edits, or hides a question (?id=). */
export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "reviews");

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing question id", 400);

  const data = await parseBody(req, answerQuestionSchema);
  const existing = await db.productQuestion.findFirst({ where: { id, storeId } });
  if (!existing) return fail("Question not found", 404);

  const question = await db.productQuestion.update({
    where: { id: existing.id },
    data: {
      ...(data.answer !== undefined && {
        answer: data.answer,
        ...(data.answer
          ? { status: "ANSWERED", answeredAt: new Date() }
          : { status: "PENDING", answeredAt: null }),
      }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });
  return ok({ question });
});
