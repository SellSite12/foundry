import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { shippingRateSchema } from "@/lib/validation/seller";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "settings");

  const rates = await db.shippingRate.findMany({
    where: { storeId },
    orderBy: { priceCents: "asc" },
  });
  return ok({ rates });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "settings");
  const data = await parseBody(req, shippingRateSchema);

  const rate = await db.shippingRate.create({
    data: {
      storeId,
      name: data.name,
      kind: data.kind ?? "DELIVERY",
      region: data.region ?? "Everywhere",
      countries: data.countries ?? null,
      priceCents: data.priceCents,
      freeAboveCents: data.freeAboveCents ?? null,
      minDays: data.minDays ?? null,
      maxDays: data.maxDays ?? null,
      active: data.active ?? true,
    },
  });
  return ok({ rate }, { status: 201 });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "settings");

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing rate id", 400);

  const data = await parseBody(req, shippingRateSchema.partial());
  const result = await db.shippingRate.updateMany({ where: { id, storeId }, data });
  if (result.count === 0) return fail("Shipping rate not found", 404);

  const rate = await db.shippingRate.findUnique({ where: { id } });
  return ok({ rate });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { storeId } = await params;
  await requireStoreAccess(storeId, "settings");

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing rate id", 400);

  const result = await db.shippingRate.deleteMany({ where: { id, storeId } });
  if (result.count === 0) return fail("Shipping rate not found", 404);
  return ok({ deleted: true });
});
