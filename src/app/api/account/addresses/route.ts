import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { addressSchema } from "@/lib/validation/shop";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return ok({ addresses });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const data = await parseBody(req, addressSchema);

  const count = await db.address.count({ where: { userId: user.id } });
  const makeDefault = data.isDefault || count === 0;

  if (makeDefault) {
    await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }
  const address = await db.address.create({
    data: {
      userId: user.id,
      label: data.label,
      name: data.name,
      phone: data.phone ?? null,
      line1: data.line1,
      line2: data.line2 ?? null,
      city: data.city,
      state: data.state ?? null,
      postalCode: data.postalCode,
      country: data.country,
      isDefault: makeDefault,
    },
  });
  return ok({ address }, { status: 201 });
});

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing address id", 400);

  const data = await parseBody(req, addressSchema.partial());
  const existing = await db.address.findFirst({ where: { id, userId: user.id } });
  if (!existing) return fail("Address not found", 404);

  if (data.isDefault) {
    await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }
  const address = await db.address.update({
    where: { id: existing.id },
    data: {
      ...(data.label !== undefined && { label: data.label }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.line1 !== undefined && { line1: data.line1 }),
      ...(data.line2 !== undefined && { line2: data.line2 }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
    },
  });
  return ok({ address });
});

export const DELETE = withErrorHandling(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing address id", 400);

  const result = await db.address.deleteMany({ where: { id, userId: user.id } });
  if (result.count === 0) return fail("Address not found", 404);
  return ok({ deleted: true });
});
