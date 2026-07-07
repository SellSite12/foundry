"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/client/api";
import { formatMoney } from "@/lib/money";
import { emitCartUpdated } from "@/components/storefront/CartBadge";

type Variant = {
  id: string;
  name: string;
  options: Record<string, string>;
  priceCents: number | null;
  stock: number;
};

type Props = {
  slug: string;
  productId: string;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  trackInventory: boolean;
  stock: number;
  variants: Variant[];
  requiresShipping: boolean;
  shippingEstimate: { minDays: number | null; maxDays: number | null } | null;
};

/** Variant selection + quantity + add-to-cart with live stock feedback. */
export function ProductPurchase(props: Props) {
  const router = useRouter();

  // Option axes (e.g. Size, Color) derived from variant options.
  const axes = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const v of props.variants) {
      for (const [k, val] of Object.entries(v.options)) {
        if (!map.has(k)) map.set(k, new Set());
        map.get(k)!.add(val);
      }
    }
    return [...map.entries()].map(([name, values]) => ({ name, values: [...values] }));
  }, [props.variants]);

  const [selection, setSelection] = useState<Record<string, string>>(() => {
    const first = props.variants[0];
    return first ? { ...first.options } : {};
  });
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const selectedVariant = useMemo(() => {
    if (props.variants.length === 0) return null;
    return (
      props.variants.find((v) =>
        Object.entries(selection).every(([k, val]) => v.options[k] === val)
      ) ?? null
    );
  }, [props.variants, selection]);

  const unitPrice = selectedVariant?.priceCents ?? props.priceCents;
  const stock = !props.trackInventory
    ? null
    : selectedVariant
      ? selectedVariant.stock
      : props.stock;
  const outOfStock = stock !== null && stock <= 0;
  const needsVariant = props.variants.length > 0 && !selectedVariant;

  async function addToCart(goToCart: boolean) {
    setBusy(true);
    setMessage(null);
    const res = await api<{ cart: { itemCount: number } }>(`/api/shop/${props.slug}/cart`, {
      method: "POST",
      body: {
        productId: props.productId,
        variantId: selectedVariant?.id ?? null,
        quantity,
      },
    });
    setBusy(false);
    if (!res.ok) {
      setMessage({ kind: "error", text: res.error });
      return;
    }
    emitCartUpdated(res.data.cart.itemCount);
    if (goToCart) {
      router.push(`/shop/${props.slug}/cart`);
    } else {
      setMessage({ kind: "ok", text: "Added to cart." });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold" style={{ color: "var(--sf-text)" }}>
          {formatMoney(unitPrice, props.currency)}
        </span>
        {props.compareAtCents != null && props.compareAtCents > unitPrice ? (
          <s className="text-lg" style={{ color: "var(--sf-text-dim)" }}>
            {formatMoney(props.compareAtCents, props.currency)}
          </s>
        ) : null}
      </div>

      {/* Inventory status */}
      <p className="text-[13px] font-medium" role="status" style={{ color: outOfStock ? "#EF4444" : stock !== null && stock <= 5 ? "var(--sf-primary)" : "var(--sf-text-dim)" }}>
        {outOfStock
          ? "Out of stock"
          : stock === null
            ? "In stock"
            : stock <= 5
              ? `Only ${stock} left in stock`
              : "In stock"}
      </p>

      {/* Variant axes */}
      {axes.map((axis) => (
        <fieldset key={axis.name}>
          <legend className="mb-2 text-[13px] font-semibold" style={{ color: "var(--sf-text)" }}>
            {axis.name}
          </legend>
          <div className="flex flex-wrap gap-2">
            {axis.values.map((value) => {
              const active = selection[axis.name] === value;
              // Would this choice lead to an existing variant?
              const feasible = props.variants.some(
                (v) =>
                  v.options[axis.name] === value &&
                  Object.entries(selection).every(
                    ([k, val]) => k === axis.name || v.options[k] === val
                  )
              );
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelection((s) => ({ ...s, [axis.name]: value }))}
                  className="border px-3.5 py-2 text-[13.5px] font-medium transition-colors"
                  style={{
                    borderRadius: "var(--sf-btn-radius)",
                    borderColor: active ? "var(--sf-primary)" : "var(--sf-line)",
                    color: active ? "var(--sf-primary)" : feasible ? "var(--sf-text)" : "var(--sf-text-dim)",
                    opacity: feasible ? 1 : 0.5,
                    background: "var(--sf-surface)",
                  }}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      {/* Quantity + CTA */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex items-center border"
          style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "var(--sf-line)" }}
        >
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((n) => Math.max(1, n - 1))}
            className="px-3.5 py-2.5 text-lg"
            style={{ color: "var(--sf-text)" }}
          >
            −
          </button>
          <span className="min-w-8 text-center text-[14px] font-semibold" aria-live="polite" style={{ color: "var(--sf-text)" }}>
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQuantity((n) => (stock !== null ? Math.min(stock, n + 1) : n + 1))}
            className="px-3.5 py-2.5 text-lg"
            style={{ color: "var(--sf-text)" }}
          >
            +
          </button>
        </div>

        <button
          type="button"
          disabled={busy || outOfStock || needsVariant}
          onClick={() => addToCart(false)}
          className="flex-1 px-6 py-3 text-[14px] font-semibold text-white transition-transform enabled:hover:scale-[1.01] disabled:opacity-50"
          style={{ background: "var(--sf-primary)", borderRadius: "var(--sf-btn-radius)", minWidth: "160px" }}
        >
          {busy ? "Adding…" : outOfStock ? "Out of stock" : "Add to cart"}
        </button>
        <button
          type="button"
          disabled={busy || outOfStock || needsVariant}
          onClick={() => addToCart(true)}
          className="border px-6 py-3 text-[14px] font-semibold transition-colors disabled:opacity-50"
          style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "var(--sf-primary)", color: "var(--sf-primary)" }}
        >
          Buy now
        </button>
      </div>

      {message ? (
        <p role="status" className="text-[13px] font-medium" style={{ color: message.kind === "ok" ? "#22C55E" : "#EF4444" }}>
          {message.text}
        </p>
      ) : null}

      {/* Shipping estimate */}
      {props.requiresShipping ? (
        <p className="text-[13px]" style={{ color: "var(--sf-text-dim)" }}>
          {props.shippingEstimate?.minDays != null
            ? `Estimated delivery: ${props.shippingEstimate.minDays}–${props.shippingEstimate.maxDays ?? props.shippingEstimate.minDays} business days.`
            : "Ships from our warehouse — options shown at checkout."}
        </p>
      ) : (
        <p className="text-[13px]" style={{ color: "var(--sf-text-dim)" }}>
          Digital or service item — no shipping required.
        </p>
      )}
    </div>
  );
}
