import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { getPagination, pageMeta } from "@/lib/seller/pagination";

/** The buyer's purchase history across all storefronts. */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const { page, take, skip } = getPagination(req);

  const where = {
    OR: [{ customerId: user.id }, { customerEmail: user.email.toLowerCase() }],
  };

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        currency: true,
        createdAt: true,
        trackingNumber: true,
        shippingCarrier: true,
        store: { select: { name: true, slug: true } },
        items: { select: { productName: true, quantity: true } },
      },
    }),
  ]);

  return ok({ orders, ...pageMeta(total, page) });
});
