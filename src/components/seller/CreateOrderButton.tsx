"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import { api } from "@/lib/client/api";
import { formatMoney, toCents } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/seller/ui";

type ProductOption = {
  id: string;
  name: string;
  priceCents: number;
  variants: { id: string; name: string; priceCents: number | null }[];
};

type Line = { productId: string; variantId: string; quantity: string };

export function CreateOrderButton({
  storeId,
  currency,
  products,
  primary = false,
}: {
  storeId: string;
  currency: string;
  products: ProductOption[];
  primary?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: "", variantId: "", quantity: "1" }]);
  const [shipping, setShipping] = useState("");
  const [discount, setDiscount] = useState("");
  const [markPaid, setMarkPaid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productMap = new Map(products.map((p) => [p.id, p]));

  const subtotal = lines.reduce((sum, l) => {
    const product = productMap.get(l.productId);
    if (!product) return sum;
    const variant = product.variants.find((v) => v.id === l.variantId);
    const unit = variant?.priceCents ?? product.priceCents;
    return sum + unit * (parseInt(l.quantity, 10) || 0);
  }, 0);

  function setLine(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const items = lines
      .filter((l) => l.productId)
      .map((l) => ({
        productId: l.productId,
        variantId: l.variantId || null,
        quantity: parseInt(l.quantity, 10) || 1,
      }));

    const res = await api<{ order: { id: string } }>(`/api/store/${storeId}/orders`, {
      method: "POST",
      body: {
        customerName: name,
        customerEmail: email,
        items,
        shippingCents: shipping ? toCents(shipping) : 0,
        discountCents: discount ? toCents(discount) : 0,
        markPaid,
      },
    });

    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOpen(false);
    router.push(`/store/${storeId}/orders/${res.data.order.id}`);
    router.refresh();
  }

  return (
    <>
      <Button variant={primary ? "primary" : "primary"} onClick={() => setOpen(true)}>
        <Plus size={14} /> Create order
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create manual order" wide>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          {error && <Alert kind="error">{error}</Alert>}
          {products.length === 0 && (
            <Alert kind="info">Add at least one product before creating orders.</Alert>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Customer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Customer email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[12.5px] font-medium text-ink-dim">Items</span>
            {lines.map((line, i) => {
              const product = productMap.get(line.productId);
              return (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={line.productId}
                    onChange={(e) =>
                      setLine(i, { productId: e.target.value, variantId: "" })
                    }
                    className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none"
                  >
                    <option value="">Select product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatMoney(p.priceCents, currency)}
                      </option>
                    ))}
                  </select>
                  {product && product.variants.length > 0 && (
                    <select
                      value={line.variantId}
                      onChange={(e) => setLine(i, { variantId: e.target.value })}
                      className="w-32 rounded-xl border border-line bg-surface px-2 py-2 text-[12.5px] text-ink outline-none"
                    >
                      <option value="">Base</option>
                      {product.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => setLine(i, { quantity: e.target.value })}
                    className="w-16 rounded-xl border border-line bg-surface px-2 py-2 text-center text-[13px] text-ink outline-none"
                    aria-label="Quantity"
                  />
                  <button
                    type="button"
                    onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                    disabled={lines.length === 1}
                    className="text-ink-faint hover:text-danger disabled:opacity-30"
                    aria-label="Remove line"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() =>
                setLines((ls) => [...ls, { productId: "", variantId: "", quantity: "1" }])
              }
              className="self-start text-[12.5px] text-copper hover:underline"
            >
              + Add another item
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`Shipping (${currency})`}
              type="number"
              min="0"
              step="0.01"
              value={shipping}
              onChange={(e) => setShipping(e.target.value)}
            />
            <Input
              label={`Discount (${currency})`}
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-dim">
            <input
              type="checkbox"
              checked={markPaid}
              onChange={(e) => setMarkPaid(e.target.checked)}
              className="h-4 w-4 accent-[#E8A33D]"
            />
            Mark as paid (records a manual payment and decrements inventory)
          </label>

          <div className="flex items-center justify-between border-t border-line pt-4">
            <span className="text-[13px] text-ink-faint">
              Subtotal:{" "}
              <span className="fdy-mono font-semibold text-ink">
                {formatMoney(subtotal, currency)}
              </span>{" "}
              + tax at checkout
            </span>
            <Button type="submit" loading={loading} disabled={products.length === 0}>
              Create order
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
