import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess, notifyStoreOwner } from "@/lib/seller/access";
import { customerSchema } from "@/lib/validation/seller";
import { getPagination, pageMeta } from "@/lib/seller/pagination";
import { REVENUE_STATUSES } from "@/lib/constants";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "customers");

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const tag = sp.get("tag")?.trim();
  const { page, take, skip } = getPagination(req);

  const where: Prisma.CustomerWhereInput = {
    storeId,
    ...(q && {
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ],
    }),
    ...(tag && { tags: { contains: tag } }),
  };

  const [total, customers] = await Promise.all([
    db.customer.count({ where }),
    db.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        orders: {
          where: { status: { in: [...REVENUE_STATUSES, "REFUNDED"] } },
          select: { totalCents: true, refundedCents: true },
        },
        _count: { select: { orders: true } },
      },
    }),
  ]);

  // Lifetime value computed from real orders.
  const withLtv = customers.map(({ orders, ...c }) => ({
    ...c,
    lifetimeValueCents: orders.reduce((s, o) => s + o.totalCents - o.refundedCents, 0),
  }));

  return ok({ customers: withLtv, ...pageMeta(total, page) });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { store, user } = await requireStoreAccess(storeId, "customers");
  const data = await parseBody(req, customerSchema);

  const existing = await db.customer.findUnique({
    where: { storeId_email: { storeId, email: data.email } },
  });
  if (existing) {
    return fail("A customer with this email already exists", 409, {
      email: "A customer with this email already exists",
    });
  }

  const customer = await db.customer.create({ data: { ...data, storeId } });

  await notifyStoreOwner(
    store,
    {
      type: "CUSTOMER",
      title: "New customer added",
      body: `${customer.name} (${customer.email})`,
      href: `/store/${storeId}/customers/${customer.id}`,
    },
    user.id
  );

  return ok({ customer }, { status: 201 });
});
