import { notFound } from "next/navigation";
import { Users } from "lucide-react";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PAGE_SIZE } from "@/lib/seller/pagination";
import { PageHeader, EmptyState } from "@/components/seller/ui";
import { CustomersTable } from "@/components/seller/CustomersTable";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Customers" };

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { storeId } = await params;
  const sp = await searchParams;
  const access = await getStoreAccess(storeId, "customers");
  if (!access) notFound();

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const q = sp.q?.trim();

  const where: Prisma.CustomerWhereInput = {
    storeId,
    ...(q && {
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { tags: { contains: q } },
      ],
    }),
  };

  const [total, customers, anyCustomer] = await Promise.all([
    db.customer.count({ where }),
    db.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        orders: {
          where: { paidAt: { not: null } },
          select: { totalCents: true, refundedCents: true },
        },
        _count: { select: { orders: true } },
      },
    }),
    db.customer.findFirst({ where: { storeId }, select: { id: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${total} customer${total === 1 ? "" : "s"}`}
      />

      {!anyCustomer ? (
        <>
          <div className="mb-4">
            <CustomersTable
              storeId={storeId}
              currency={access.store.currency}
              customers={[]}
              page={1}
              pageCount={1}
              q=""
              toolbarOnly
            />
          </div>
          <EmptyState
            icon={<Users size={20} />}
            title="No customers yet"
            body="Customers are created automatically with every order, added manually, or imported from CSV."
          />
        </>
      ) : (
        <CustomersTable
          storeId={storeId}
          currency={access.store.currency}
          customers={customers.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            tags: c.tags,
            orderCount: c._count.orders,
            lifetimeValueCents: c.orders.reduce(
              (s, o) => s + o.totalCents - o.refundedCents,
              0
            ),
            createdAt: c.createdAt.toISOString(),
          }))}
          page={page}
          pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          q={q ?? ""}
        />
      )}
    </div>
  );
}
