"use client";

import { useState } from "react";

import { api } from "@/lib/client/api";
import { formatMoney } from "@/lib/money";

type TrackedOrder = {
  orderNumber: number;
  status: string;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  trackingNumber: string | null;
  shippingCarrier: string | null;
  shippingMethod: string | null;
  totalCents: number;
  currency: string;
  items: { productName: string; variantName: string | null; quantity: number }[];
  timeline: { type: string; message: string; createdAt: string }[];
};

const STATUS_FLOW = ["PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"];

export function TrackOrderForm({ slug }: { slug: string }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOrder(null);
    const res = await api<{ order: TrackedOrder }>(`/api/shop/${slug}/track`, {
      method: "POST",
      body: { orderNumber: parseInt(orderNumber, 10) || 0, email },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOrder(res.data.order);
  }

  const statusIndex = order ? STATUS_FLOW.indexOf(order.status) : -1;

  return (
    <div className="mt-8">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Order number (e.g. 1001)"
          required
          inputMode="numeric"
          aria-label="Order number"
          className="flex-1 px-3.5 py-2.5 text-[14px] outline-none"
          style={{ borderRadius: "8px", border: "1px solid var(--sf-line)", background: "var(--sf-surface)", color: "var(--sf-text)" }}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email used at checkout"
          required
          aria-label="Email address"
          className="flex-1 px-3.5 py-2.5 text-[14px] outline-none"
          style={{ borderRadius: "8px", border: "1px solid var(--sf-line)", background: "var(--sf-surface)", color: "var(--sf-text)" }}
        />
        <button
          type="submit"
          disabled={busy}
          className="px-6 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--sf-primary)", borderRadius: "var(--sf-btn-radius)" }}
        >
          {busy ? "Looking up…" : "Track order"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-4 text-[13.5px] font-medium" style={{ color: "#EF4444" }}>
          {error}
        </p>
      ) : null}

      {order ? (
        <div
          className="mt-8 border p-6"
          style={{ borderRadius: "var(--sf-radius)", borderColor: "var(--sf-card-border)", background: "var(--sf-surface)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold" style={{ color: "var(--sf-text)" }}>
              Order #{order.orderNumber}
            </h2>
            <span
              className="rounded-full px-3 py-1 text-[12px] font-semibold"
              style={{ background: "color-mix(in srgb, var(--sf-primary) 15%, transparent)", color: "var(--sf-primary)" }}
            >
              {order.status}
            </span>
          </div>

          {/* Progress */}
          {statusIndex >= 0 ? (
            <ol className="mt-6 flex items-center gap-0" aria-label="Order progress">
              {STATUS_FLOW.map((s, i) => (
                <li key={s} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full items-center">
                    <div className="h-0.5 flex-1" style={{ background: i === 0 ? "transparent" : i <= statusIndex ? "var(--sf-primary)" : "var(--sf-line)" }} />
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{
                        background: i <= statusIndex ? "var(--sf-primary)" : "var(--sf-line)",
                        color: i <= statusIndex ? "#fff" : "var(--sf-text-dim)",
                      }}
                      aria-hidden
                    >
                      {i < statusIndex ? "✓" : i + 1}
                    </span>
                    <div className="h-0.5 flex-1" style={{ background: i === STATUS_FLOW.length - 1 ? "transparent" : i < statusIndex ? "var(--sf-primary)" : "var(--sf-line)" }} />
                  </div>
                  <span className="text-[10.5px] font-medium capitalize" style={{ color: i <= statusIndex ? "var(--sf-text)" : "var(--sf-text-dim)" }}>
                    {s.toLowerCase()}
                  </span>
                </li>
              ))}
            </ol>
          ) : null}

          {order.trackingNumber ? (
            <p className="mt-5 text-[13.5px]" style={{ color: "var(--sf-text-dim)" }}>
              Tracking: <strong style={{ color: "var(--sf-text)" }}>{order.trackingNumber}</strong>
              {order.shippingCarrier ? ` via ${order.shippingCarrier}` : ""}
            </p>
          ) : null}

          <ul className="mt-5 space-y-1.5 border-t pt-4 text-[13.5px]" style={{ borderColor: "var(--sf-line)", color: "var(--sf-text-dim)" }}>
            {order.items.map((it, i) => (
              <li key={i}>
                {it.quantity} × {it.productName}
                {it.variantName ? ` (${it.variantName})` : ""}
              </li>
            ))}
            <li className="pt-1 font-semibold" style={{ color: "var(--sf-text)" }}>
              Total: {formatMoney(order.totalCents, order.currency)}
            </li>
          </ul>

          {order.timeline.length > 0 ? (
            <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--sf-line)" }}>
              <h3 className="mb-2 text-[13px] font-semibold" style={{ color: "var(--sf-text)" }}>History</h3>
              <ul className="space-y-2 text-[13px]" style={{ color: "var(--sf-text-dim)" }}>
                {order.timeline.map((t, i) => (
                  <li key={i} className="flex justify-between gap-4">
                    <span>{t.message}</span>
                    <span className="shrink-0">{new Date(t.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
