"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

import { api } from "@/lib/client/api";
import { formatMoney, toCents } from "@/lib/money";
import { ORDER_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Panel, Modal } from "@/components/seller/ui";

type OrderShape = {
  id: string;
  status: string;
  trackingNumber: string | null;
  shippingCarrier: string | null;
  internalNote: string | null;
  totalCents: number;
  refundedCents: number;
  currency: string;
  paid: boolean;
};

const selectClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-line-strong";

export function OrderActions({ storeId, order }: { storeId: string; order: OrderShape }) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [tracking, setTracking] = useState(order.trackingNumber ?? "");
  const [carrier, setCarrier] = useState(order.shippingCarrier ?? "");
  const [note, setNote] = useState(order.internalNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState(
    ((order.totalCents - order.refundedCents) / 100).toFixed(2)
  );
  const [refundReason, setRefundReason] = useState("");
  const [restock, setRestock] = useState(true);
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await api(`/api/store/${storeId}/orders/${order.id}`, {
      method: "PATCH",
      body: {
        status,
        trackingNumber: tracking || null,
        shippingCarrier: carrier || null,
        internalNote: note || null,
      },
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function refund(e: React.FormEvent) {
    e.preventDefault();
    setRefunding(true);
    setRefundError(null);
    const res = await api(`/api/store/${storeId}/orders/${order.id}/refund`, {
      method: "POST",
      body: {
        amountCents: toCents(refundAmount),
        reason: refundReason,
        restock,
      },
    });
    setRefunding(false);
    if (!res.ok) {
      setRefundError(res.error);
      return;
    }
    setRefundOpen(false);
    router.refresh();
  }

  const refundable = order.totalCents - order.refundedCents;

  return (
    <>
      <Panel title="Manage order">
        <div className="flex flex-col gap-4">
          {error && <Alert kind="error">{error}</Alert>}

          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-medium text-ink-dim">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={selectClass}
              disabled={order.status === "REFUNDED"}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s[0] + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Tracking number"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="1Z999AA10123456784"
          />
          <Input
            label="Shipping carrier"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="UPS, FedEx, DHL…"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-medium text-ink-dim">
              Internal note (never shown to the customer)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className={selectClass}
            />
          </div>

          <Button onClick={save} loading={saving} full>
            Save changes
          </Button>

          {order.paid && refundable > 0 && (
            <Button variant="secondary" onClick={() => setRefundOpen(true)} full>
              <RotateCcw size={14} /> Refund order
            </Button>
          )}
        </div>
      </Panel>

      <Modal open={refundOpen} onClose={() => setRefundOpen(false)} title="Refund order">
        <form onSubmit={refund} className="flex flex-col gap-4" noValidate>
          {refundError && <Alert kind="error">{refundError}</Alert>}
          <p className="text-[13px] text-ink-dim">
            Up to{" "}
            <span className="fdy-mono font-semibold text-ink">
              {formatMoney(refundable, order.currency)}
            </span>{" "}
            can be refunded.
          </p>
          <Input
            label={`Amount (${order.currency})`}
            type="number"
            min="0.01"
            step="0.01"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            required
          />
          <Input
            label="Reason"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="Damaged item, customer request…"
            required
          />
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-dim">
            <input
              type="checkbox"
              checked={restock}
              onChange={(e) => setRestock(e.target.checked)}
              className="h-4 w-4 accent-[#E8A33D]"
            />
            Restock items
          </label>
          <Button type="submit" loading={refunding} full>
            Issue refund
          </Button>
        </form>
      </Modal>
    </>
  );
}
