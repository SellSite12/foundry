import { notFound } from "next/navigation";
import { ShoppingCart } from "lucide-react";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PAGE_SIZE } from "@/lib/seller/pagination";
import { PageHeader, EmptyState } from "@/components/seller/ui";
import { OrdersTable } from "@/components/seller/OrdersTable";
import { CreateOrderButton } from "@/components/seller/CreateOrderButton";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Orders" };

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { storeId } = await params;
  const sp = await searchParams;
  const access = await getStoreAccess(storeId, "orders");
  if (!access) notFound();

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const q = sp.q?.trim();
  const status = sp.status;

  const where: Prisma.OrderWhereInput = {
    storeId,
    ...(status && { status }),
    ...(q && {
      OR: [
        { customerEmail: { contains: q } },
        { trackingNumber: { contains: q } },
        ...(Number.isFinite(parseInt(q.replace(/^#/, ""), 10))
          ? [{ orderNumber: parseInt(q.replace(/^#/, ""), 10) }]
          : []),
      ],
    }),
  };

  const [total, orders, anyOrder, products] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        customerRef: { select: { name: true } },
        _count: { select: { items: true } },
      },
    }),
    db.order.findFirst({ where: { storeId }, select: { id: true } }),
    db.product.findMany({
      where: { storeId, status: { not: "ARCHIVED" } },
      orderBy: { name: "asc" },
      take: 200,
      select: {
        id: true,
        name: true,
        priceCents: true,
        variants: { select: { id: true, name: true, priceCents: true } },
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Orders"
        description={`${total} order${total === 1 ? "" : "s"}${status ? ` · ${status.toLowerCase()}` : ""}`}
        actions={
          <CreateOrderButton
            storeId={storeId}
            currency={access.store.currency}
            products={products}
          />
        }
      />

      {!anyOrder ? (
        <EmptyState
          icon={<ShoppingCart size={20} />}
          title="No orders yet"
          body="Create a manual order for phone or in-person sales. Storefront checkout arrives in Phase 4 — every order will land here."
          action={
            <CreateOrderButton
              storeId={storeId}
              currency={access.store.currency}
              products={products}
              primary
            />
          }
        />
      ) : (
        <OrdersTable
          storeId={storeId}
          orders={orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customerEmail: o.customerEmail,
            customerName: o.customerRef?.name ?? null,
            status: o.status,
            totalCents: o.totalCents,
            currency: o.currency,
            itemCount: o._count.items,
            createdAt: o.createdAt.toISOString(),
          }))}
          page={page}
          pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          q={q ?? ""}
          status={status ?? ""}
        />
      )}
    </div>
  );
}
