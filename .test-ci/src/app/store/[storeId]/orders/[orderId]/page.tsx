import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer, FileText } from "lucide-react";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { formatMoney } from "@/lib/money";
import { PageHeader, Panel, StatusBadge } from "@/components/seller/ui";
import { OrderActions } from "@/components/seller/OrderActions";

export const metadata = { title: "Order details" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ storeId: string; orderId: string }>;
}) {
  const { storeId, orderId } = await params;
  const access = await getStoreAccess(storeId, "orders");
  if (!access) notFound();

  const order = await db.order.findFirst({
    where: { id: orderId, storeId },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      timeline: { orderBy: { createdAt: "desc" } },
      customerRef: true,
    },
  });
  if (!order) notFound();

  const base = `/store/${storeId}`;

  return (
    <div>
      <PageHeader
        title={`Order #${order.orderNumber}`}
        description={`Placed ${order.createdAt.toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}`}
        actions={
          <>
            <StatusBadge status={order.status} />
            <Link
              href={`${base}/orders/${order.id}/invoice`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-full border border-line-strong px-3.5 py-2 text-[12.5px] text-ink-dim hover:text-ink"
            >
              <FileText size={13} /> Invoice
            </Link>
            <Link
              href={`${base}/orders/${order.id}/packing-slip`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-full border border-line-strong px-3.5 py-2 text-[12.5px] text-ink-dim hover:text-ink"
            >
              <Printer size={13} /> Packing slip
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Panel title="Items">
            <div className="flex flex-col">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-line py-3 last:border-0"
                >
                  <div>
                    <Link
                      href={`${base}/products/${item.productId}`}
                      className="text-[13.5px] font-medium text-ink hover:text-copper"
                    >
                      {item.productName}
                    </Link>
                    {item.variantName && (
                      <div className="text-[11.5px] text-ink-faint">{item.variantName}</div>
                    )}
                  </div>
                  <div className="fdy-mono text-[13px] text-ink-dim">
                    {item.quantity} × {formatMoney(item.unitPriceCents, order.currency)} ={" "}
                    <span className="text-ink">
                      {formatMoney(item.quantity * item.unitPriceCents, order.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-[13px]">
              <Row label="Subtotal" value={formatMoney(order.subtotalCents, order.currency)} />
              {order.discountCents > 0 && (
                <Row label="Discount" value={`−${formatMoney(order.discountCents, order.currency)}`} />
              )}
              <Row label="Shipping" value={formatMoney(order.shippingCents, order.currency)} />
              <Row label="Tax" value={formatMoney(order.taxCents, order.currency)} />
              <div className="mt-1 flex items-center justify-between border-t border-line pt-2.5">
                <span className="font-semibold text-ink">Total</span>
                <span className="fdy-mono text-[15px] font-semibold text-ink">
                  {formatMoney(order.totalCents, order.currency)}
                </span>
              </div>
              {order.refundedCents > 0 && (
                <Row
                  label="Refunded"
                  value={`−${formatMoney(order.refundedCents, order.currency)}`}
                  danger
                />
              )}
            </div>
          </Panel>

          <Panel title="Timeline">
            {order.timeline.length === 0 ? (
              <p className="text-[13px] text-ink-faint">No events yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {order.timeline.map((e) => (
                  <div key={e.id} className="flex gap-3">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-copper" />
                    <div className="flex-1">
                      <p className="text-[13px] text-ink">
                        {e.message}
                        {e.internal && (
                          <span className="ml-2 rounded bg-hover px-1.5 py-0.5 text-[9.5px] text-ink-faint">
                            INTERNAL
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[11px] text-ink-faint">
                        {e.createdAt.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Payments">
            {order.payments.length === 0 ? (
              <p className="text-[13px] text-ink-faint">
                No payments recorded. Mark the order paid to record a manual payment.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {order.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-[13px]">
                    <span className="text-ink-dim">
                      {p.provider} · {p.createdAt.toLocaleDateString("en-US")}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={`fdy-mono ${p.amountCents < 0 ? "text-danger" : "text-ink"}`}>
                        {formatMoney(p.amountCents, p.currency)}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Panel title="Customer">
            <div className="text-[13.5px] font-medium text-ink">
              {order.customerRef?.name ?? "Guest"}
            </div>
            <div className="mt-0.5 text-[12.5px] text-ink-faint">{order.customerEmail}</div>
            {order.customerRef && (
              <Link
                href={`${base}/customers/${order.customerRef.id}`}
                className="mt-2 inline-block text-[12px] text-copper hover:underline"
              >
                View customer profile →
              </Link>
            )}
            {order.customerNote && (
              <div className="mt-3 rounded-lg bg-base2 p-3 text-[12.5px] text-ink-dim">
                <span className="mb-1 block text-[10.5px] font-semibold uppercase text-ink-faint">
                  Customer note
                </span>
                {order.customerNote}
              </div>
            )}
          </Panel>

          <OrderActions
            storeId={storeId}
            order={{
              id: order.id,
              status: order.status,
              trackingNumber: order.trackingNumber,
              shippingCarrier: order.shippingCarrier,
              internalNote: order.internalNote,
              totalCents: order.totalCents,
              refundedCents: order.refundedCents,
              currency: order.currency,
              paid: Boolean(order.paidAt),
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-faint">{label}</span>
      <span className={`fdy-mono ${danger ? "text-danger" : "text-ink-dim"}`}>{value}</span>
    </div>
  );
}
