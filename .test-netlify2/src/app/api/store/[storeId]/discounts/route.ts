import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { discountSchema } from "@/lib/validation/seller";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");

  const discounts = await db.discount.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
  return ok({ discounts });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");
  const data = await parseBody(req, discountSchema);

  const kind = data.kind ?? "CODE";
  if (kind === "CODE" && !data.code) {
    return fail("Discount code is required", 400, { code: "Required for code discounts" });
  }
  if (data.type === "PERCENT" && data.value > 100) {
    return fail("Percentage can't exceed 100", 400, { value: "Max 100%" });
  }

  if (data.code) {
    const existing = await db.discount.findFirst({ where: { storeId, code: data.code } });
    if (existing) {
      return fail("This code already exists", 409, { code: "Already in use" });
    }
  }

  const discount = await db.discount.create({
    data: {
      storeId,
      kind,
      code: kind === "CODE" || kind === "BUNDLE" ? (data.code ?? null) : null,
      title: data.title,
      type: data.type,
      value: data.value,
      minSubtotalCents: data.minSubtotalCents ?? null,
      usageLimit: data.usageLimit ?? null,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      status: data.status ?? "ACTIVE",
    },
  });

  return ok({ discount }, { status: 201 });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing discount id", 400);

  const data = await parseBody(req, discountSchema.partial());
  const result = await db.discount.updateMany({
    where: { id, storeId },
    data: {
      ...data,
      startsAt: data.startsAt !== undefined ? (data.startsAt ? new Date(data.startsAt) : null) : undefined,
      endsAt: data.endsAt !== undefined ? (data.endsAt ? new Date(data.endsAt) : null) : undefined,
    },
  });
  if (result.count === 0) return fail("Discount not found", 404);

  const discount = await db.discount.findUnique({ where: { id } });
  return ok({ discount });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing discount id", 400);

  const result = await db.discount.deleteMany({ where: { id, storeId } });
  if (result.count === 0) return fail("Discount not found", 404);
  return ok({ deleted: true });
});
