import Link from "next/link";
import { notFound } from "next/navigation";
import { CreditCard } from "lucide-react";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { formatMoney } from "@/lib/money";
import { PageHeader, StatCard, EmptyState, Table, Th, Td, StatusBadge, Panel } from "@/components/seller/ui";

export const metadata = { title: "Payments" };

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "orders");
  if (!access) notFound();
  const currency = access.store.currency;

  const payments = await db.payment.findMany({
    where: { order: { storeId } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { order: { select: { id: true, orderNumber: true, customerEmail: true } } },
  });

  const captured = payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((s, p) => s + p.amountCents, 0);
  const refunded = payments
    .filter((p) => p.status === "REFUNDED")
    .reduce((s, p) => s + Math.abs(p.amountCents), 0);

  const base = `/store/${storeId}`;

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Every payment and refund recorded against your orders."
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Captured" value={formatMoney(captured, currency)} />
        <StatCard label="Refunded" value={formatMoney(refunded, currency)} />
        <StatCard label="Net" value={formatMoney(captured - refunded, currency)} />
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={20} />}
          title="No payments yet"
          body="Payments are recorded when orders are marked paid. Card processing (Stripe) connects in Phase 4 — the data model is already in place."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Provider</Th>
              <Th>Status</Th>
              <Th>Amount</Th>
              <Th>Date</Th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-hover">
                <Td>
                  <Link
                    href={`${base}/orders/${p.order.id}`}
                    className="fdy-mono font-semibold text-ink hover:text-copper"
                  >
                    #{p.order.orderNumber}
                  </Link>
                </Td>
                <Td>{p.order.customerEmail}</Td>
                <Td>{p.provider}</Td>
                <Td>
                  <StatusBadge status={p.status} />
                </Td>
                <Td className={`fdy-mono ${p.amountCents < 0 ? "text-danger" : "text-ink"}`}>
                  {formatMoney(p.amountCents, p.currency)}
                </Td>
                <Td>
                  {p.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <div className="mt-5">
        <Panel title="Payouts" description="Bank payouts arrive with Phase 4 payment processing.">
          <p className="text-[13px] text-ink-faint">
            Once Stripe is connected in Phase 4, captured payments will settle into
            payout batches shown here.
          </p>
        </Panel>
      </div>
    </div>
  );
}
