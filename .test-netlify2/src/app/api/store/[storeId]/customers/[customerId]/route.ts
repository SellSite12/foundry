import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { updateCustomerSchema } from "@/lib/validation/seller";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId, customerId } = await params;
  await requireStoreAccess(storeId, "customers");

  const customer = await db.customer.findFirst({
    where: { id: customerId, storeId },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { items: true } } },
      },
    },
  });
  if (!customer) return fail("Customer not found", 404);

  const lifetimeValueCents = customer.orders
    .filter((o) => o.paidAt)
    .reduce((s, o) => s + o.totalCents - o.refundedCents, 0);

  return ok({ customer: { ...customer, lifetimeValueCents } });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId, customerId } = await params;
  await requireStoreAccess(storeId, "customers");

  const data = await parseBody(req, updateCustomerSchema);

  const result = await db.customer.updateMany({
    where: { id: customerId, storeId },
    data,
  });
  if (result.count === 0) return fail("Customer not found", 404);

  const customer = await db.customer.findUnique({ where: { id: customerId } });
  return ok({ customer });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { storeId, customerId } = await params;
  await requireStoreAccess(storeId, "customers");

  const result = await db.customer.deleteMany({ where: { id: customerId, storeId } });
  if (result.count === 0) return fail("Customer not found", 404);
  return ok({ deleted: true });
});
