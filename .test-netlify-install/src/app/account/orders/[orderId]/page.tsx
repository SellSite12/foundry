import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Order details" };

const STATUS_FLOW = ["PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"];

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const user = await requireUser();
  const { orderId } = await params;

  const order = await db.order.findFirst({
    where: {
      id: orderId,
      OR: [{ customerId: user.id }, { customerEmail: user.email.toLowerCase() }],
    },
    include: {
      store: { select: { name: true, slug: true } },
      items: true,
      payments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          provider: true,
          method: true,
          cardBrand: true,
          cardLast4: true,
          status: true,
          amountCents: true,
          currency: true,
          createdAt: true,
        },
      },
      timeline: {
        where: { internal: false },
        orderBy: { createdAt: "asc" },
        select: { type: true, message: true, createdAt: true },
      },
    },
  });
  if (!order) notFound();

  const statusIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <div>
      <Link href="/account" className="text-[13px] font-medium text-copper hover:opacity-80">
        ← All orders
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Order #{order.orderNumber}</h1>
        <span className="rounded-full bg-copper/12 px-3.5 py-1.5 text-[12.5px] font-semibold text-copper">
          {order.status}
        </span>
      </div>
      <p className="mt-1 text-[13.5px] text-ink-dim">
        From{" "}
        <Link href={`/shop/${order.store.slug}`} className="font-medium text-copper hover:opacity-80">
          {order.store.name}
        </Link>{" "}
        · placed {order.createdAt.toLocaleDateString(undefined, { dateStyle: "long" })}
      </p>

      {/* Progress */}
      {statusIndex >= 0 ? (
        <ol className="mt-8 flex items-center" aria-label="Order progress">
          {STATUS_FLOW.map((s, i) => (
            <li key={s} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center">
                <div className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : i <= statusIndex ? "bg-copper" : "bg-line"}`} />
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                    i <= statusIndex ? "bg-copper text-white" : "bg-line text-ink-dim"
                  }`}
                  aria-hidden
                >
                  {i < statusIndex ? "✓" : i + 1}
                </span>
                <div className={`h-0.5 flex-1 ${i === STATUS_FLOW.length - 1 ? "bg-transparent" : i < statusIndex ? "bg-copper" : "bg-line"}`} />
              </div>
              <span className={`text-[11px] font-medium capitalize ${i <= statusIndex ? "text-ink" : "text-ink-dim"}`}>
                {s.toLowerCase()}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      {order.trackingNumber ? (
        <p className="mt-5 rounded-xl border border-line bg-surface px-4 py-3 text-[13.5px] text-ink-dim">
          Tracking number: <strong className="text-ink">{order.trackingNumber}</strong>
          {order.shippingCarrier ? ` via ${order.shippingCarrier}` : ""}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Items + totals */}
        <section className="rounded-2xl border border-line bg-surface p-5" aria-label="Items">
          <h2 className="text-[15px] font-semibold">Items</h2>
          <ul className="mt-3 space-y-2 text-[13.5px]">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between gap-3">
                <span className="text-ink-dim">
                  {it.quantity} × {it.productName}
                  {it.variantName ? ` (${it.variantName})` : ""}
                </span>
                <span className="font-medium">{formatMoney(it.unitPriceCents * it.quantity, order.currency)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-[13.5px]">
            <div className="flex justify-between"><dt className="text-ink-dim">Subtotal</dt><dd>{formatMoney(order.subtotalCents, order.currency)}</dd></div>
            {order.discountCents > 0 ? (
              <div className="flex justify-between"><dt className="text-ink-dim">Discount{order.discountCode ? ` (${order.discountCode})` : ""}</dt><dd className="text-success">−{formatMoney(order.discountCents, order.currency)}</dd></div>
            ) : null}
            <div className="flex justify-between"><dt className="text-ink-dim">Shipping{order.shippingMethod ? ` (${order.shippingMethod})` : ""}</dt><dd>{formatMoney(order.shippingCents, order.currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-dim">Tax</dt><dd>{formatMoney(order.taxCents, order.currency)}</dd></div>
            {order.giftCardCents > 0 ? (
              <div className="flex justify-between"><dt className="text-ink-dim">Gift card</dt><dd className="text-success">−{formatMoney(order.giftCardCents, order.currency)}</dd></div>
            ) : null}
            <div className="flex justify-between border-t border-line pt-2 text-[15px] font-bold">
              <dt>Total</dt><dd>{formatMoney(order.totalCents, order.currency)}</dd>
            </div>
            {order.refundedCents > 0 ? (
              <div className="flex justify-between text-danger"><dt>Refunded</dt><dd>{formatMoney(order.refundedCents, order.currency)}</dd></div>
            ) : null}
          </dl>
        </section>

        <div className="space-y-6">
          {/* Shipping address */}
          {order.shipLine1 ? (
            <section className="rounded-2xl border border-line bg-surface p-5" aria-label="Shipping address">
              <h2 className="text-[15px] font-semibold">Shipping address</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-dim">
                {order.shipName}<br />
                {order.shipLine1}{order.shipLine2 ? <><br />{order.shipLine2}</> : null}<br />
                {order.shipCity}{order.shipState ? `, ${order.shipState}` : ""} {order.shipPostalCode}<br />
                {order.shipCountry}
              </p>
            </section>
          ) : null}

          {/* Payments */}
          <section className="rounded-2xl border border-line bg-surface p-5" aria-label="Payments">
            <h2 className="text-[15px] font-semibold">Payment</h2>
            <ul className="mt-2 space-y-2 text-[13.5px] text-ink-dim">
              {order.payments.map((p) => (
                <li key={p.id} className="flex justify-between gap-3">
                  <span>
                    {p.cardBrand ? `${p.cardBrand} •••• ${p.cardLast4}` : p.method === "wallet" ? "Digital wallet" : p.provider}
                    <span className={`ml-2 text-[11.5px] font-semibold ${p.status === "SUCCEEDED" ? "text-success" : p.status === "REFUNDED" ? "text-danger" : ""}`}>
                      {p.status}
                    </span>
                  </span>
                  <span className="font-medium text-ink">{formatMoney(Math.abs(p.amountCents), p.currency)}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Timeline */}
          <section className="rounded-2xl border border-line bg-surface p-5" aria-label="Order history">
            <h2 className="text-[15px] font-semibold">History</h2>
            <ul className="mt-2 space-y-2.5 text-[13px] text-ink-dim">
              {order.timeline.map((t, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>{t.message}</span>
                  <span className="shrink-0 text-ink-faint">
                    {t.createdAt.toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
