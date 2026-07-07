import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { formatMoney } from "@/lib/money";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/seller/ui";
import { CustomerEditor } from "@/components/seller/CustomerEditor";

export const metadata = { title: "Customer profile" };

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ storeId: string; customerId: string }>;
}) {
  const { storeId, customerId } = await params;
  const access = await getStoreAccess(storeId, "customers");
  if (!access) notFound();

  const customer = await db.customer.findFirst({
    where: { id: customerId, storeId },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { items: true } } },
      },
    },
  });
  if (!customer) notFound();

  const paidOrders = customer.orders.filter((o) => o.paidAt);
  const ltv = paidOrders.reduce((s, o) => s + o.totalCents - o.refundedCents, 0);
  const currency = access.store.currency;
  const base = `/store/${storeId}`;

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={`Customer since ${customer.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
      />

      <div className="mb-5 grid grid-cols-3 gap-4">
        <StatCard label="Orders" value={customer.orders.length} />
        <StatCard label="Lifetime value" value={formatMoney(ltv, currency)} />
        <StatCard
          label="Avg order"
          value={
            paidOrders.length ? formatMoney(Math.round(ltv / paidOrders.length), currency) : "—"
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Purchase history">
            {customer.orders.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-ink-faint">
                No orders from this customer yet.
              </p>
            ) : (
              <div className="flex flex-col">
                {customer.orders.map((o) => (
                  <Link
                    key={o.id}
                    href={`${base}/orders/${o.id}`}
                    className="flex items-center justify-between border-b border-line py-3 last:border-0 hover:bg-hover"
                  >
                    <div>
                      <span className="fdy-mono text-[13px] font-semibold text-ink">
                        #{o.orderNumber}
                      </span>
                      <span className="ml-3 text-[12px] text-ink-faint">
                        {o.createdAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        · {o._count.items} item{o._count.items === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="fdy-mono text-[13px] text-ink">
                        {formatMoney(o.totalCents, o.currency)}
                      </span>
                      <StatusBadge status={o.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <CustomerEditor
          storeId={storeId}
          customer={{
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone ?? "",
            tags: customer.tags ?? "",
            notes: customer.notes ?? "",
            addressLine1: customer.addressLine1 ?? "",
            addressLine2: customer.addressLine2 ?? "",
            city: customer.city ?? "",
            state: customer.state ?? "",
            postalCode: customer.postalCode ?? "",
            country: customer.country ?? "",
          }}
        />
      </div>
    </div>
  );
}
