import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { toCsv } from "@/lib/seller/csv";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  const { store } = await requireStoreAccess(storeId, "customers");

  const customers = await db.customer.findMany({
    where: { storeId },
    orderBy: { createdAt: "asc" },
    include: {
      orders: {
        where: { paidAt: { not: null } },
        select: { totalCents: true, refundedCents: true },
      },
    },
  });

  const csv = toCsv(
    ["name", "email", "phone", "tags", "city", "country", "orders", "lifetime_value", "created_at"],
    customers.map((c) => [
      c.name,
      c.email,
      c.phone,
      c.tags,
      c.city,
      c.country,
      c.orders.length,
      (c.orders.reduce((s, o) => s + o.totalCents - o.refundedCents, 0) / 100).toFixed(2),
      c.createdAt.toISOString(),
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${store.slug}-customers.csv"`,
    },
  });
});
