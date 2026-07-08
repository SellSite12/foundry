import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { taxRuleSchema } from "@/lib/validation/shop";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "settings");

  const rules = await db.taxRule.findMany({
    where: { storeId },
    orderBy: [{ country: "asc" }, { state: "asc" }],
  });
  return ok({ rules });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "settings");
  const data = await parseBody(req, taxRuleSchema);

  const rule = await db.taxRule.create({
    data: {
      storeId,
      name: data.name,
      country: data.country,
      state: data.state ?? null,
      rate: data.rate,
      active: data.active ?? true,
    },
  });
  return ok({ rule }, { status: 201 });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "settings");

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing rule id", 400);

  const data = await parseBody(req, taxRuleSchema.partial());
  const result = await db.taxRule.updateMany({ where: { id, storeId }, data });
  if (result.count === 0) return fail("Tax rule not found", 404);

  const rule = await db.taxRule.findUnique({ where: { id } });
  return ok({ rule });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { storeId } = await params;
  await requireStoreAccess(storeId, "settings");

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing rule id", 400);

  const result = await db.taxRule.deleteMany({ where: { id, storeId } });
  if (result.count === 0) return fail("Tax rule not found", 404);
  return ok({ deleted: true });
});
