import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { automationSchema } from "@/lib/validation/seller";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");

  const automations = await db.automationRule.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
  return ok({ automations });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");
  const data = await parseBody(req, automationSchema);

  const automation = await db.automationRule.create({
    data: {
      storeId,
      name: data.name,
      trigger: data.trigger,
      action: data.action,
      config: data.config ?? null,
      enabled: data.enabled ?? true,
    },
  });
  return ok({ automation }, { status: 201 });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing automation id", 400);

  const data = await parseBody(req, automationSchema.partial());
  const result = await db.automationRule.updateMany({ where: { id, storeId }, data });
  if (result.count === 0) return fail("Automation not found", 404);

  const automation = await db.automationRule.findUnique({ where: { id } });
  return ok({ automation });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing automation id", 400);

  const result = await db.automationRule.deleteMany({ where: { id, storeId } });
  if (result.count === 0) return fail("Automation not found", 404);
  return ok({ deleted: true });
});
