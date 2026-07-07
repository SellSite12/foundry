"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { api } from "@/lib/client/api";
import { formatMoney } from "@/lib/money";
import { emitCartUpdated } from "@/components/storefront/CartBadge";

export type CartItemData = {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  variantName: string | null;
  quantity: number;
  unitPriceCents: number;
  compareAtCents: number | null;
  imageUrl: string | null;
  availableStock: number | null;
  unavailable: boolean;
  requiresShipping: boolean;
  savedForLater: boolean;
};

export type CartData = {
  id: string | null;
  items: CartItemData[];
  savedItems: CartItemData[];
  subtotalCents: number;
  itemCount: number;
  discountCode: string | null;
  giftCardCode: string | null;
};

export function CartView({ slug, currency, initialCart }: { slug: string; currency: string; initialCart: CartData }) {
  const [cart, setCart] = useState<CartData>(initialCart);
  const [discountCode, setDiscountCode] = useState(initialCart.discountCode ?? "");
  const [giftCardCode, setGiftCardCode] = useState(initialCart.giftCardCode ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback(
    (data: { cart: CartData }) => {
      setCart(data.cart);
      emitCartUpdated(data.cart.itemCount);
    },
    []
  );

  useEffect(() => {
    // Refresh in case another tab mutated the cart.
    api<{ cart: CartData }>(`/api/shop/${slug}/cart`).then((res) => {
      if (res.ok) setCart(res.data.cart);
    });
  }, [slug]);

  async function updateItem(itemId: string, patch: { quantity?: number; savedForLater?: boolean }) {
    setBusy(true);
    setError(null);
    const res = await api<{ cart: CartData }>(`/api/shop/${slug}/cart`, {
      method: "PATCH",
      body: { itemId, ...patch },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    apply(res.data);
  }

  async function applyCodes() {
    setBusy(true);
    setError(null);
    const res = await api<{ cart: CartData }>(`/api/shop/${slug}/cart`, {
      method: "PUT",
      body: {
        discountCode: discountCode.trim() || null,
        giftCardCode: giftCardCode.trim() || null,
      },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    apply(res.data);
  }

  const row = (item: CartItemData, saved: boolean) => (
    <li
      key={item.id}
      className="flex gap-4 border p-4"
      style={{ borderRadius: "var(--sf-radius)", borderColor: "var(--sf-card-border)", background: "var(--sf-surface)" }}
    >
      <Link href={`/shop/${slug}/products/${item.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg" style={{ background: "var(--sf-bg)" }}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-2xl" aria-hidden style={{ color: "var(--sf-text-dim)", opacity: 0.4 }}>◇</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/shop/${slug}/products/${item.slug}`} className="text-[14px] font-medium hover:opacity-75" style={{ color: "var(--sf-text)" }}>
              {item.name}
            </Link>
            {item.variantName ? (
              <p className="text-[12.5px]" style={{ color: "var(--sf-text-dim)" }}>{item.variantName}</p>
            ) : null}
            {item.unavailable ? (
              <p className="text-[12.5px] font-medium" style={{ color: "#EF4444" }}>No longer available</p>
            ) : item.availableStock !== null && item.availableStock < item.quantity ? (
              <p className="text-[12.5px] font-medium" style={{ color: "#EF4444" }}>
                Only {item.availableStock} in stock
              </p>
            ) : null}
          </div>
          <span className="text-[14px] font-semibold" style={{ color: "var(--sf-text)" }}>
            {formatMoney(item.unitPriceCents * item.quantity, currency)}
          </span>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-3">
          {!saved ? (
            <div className="flex items-center border" style={{ borderRadius: "8px", borderColor: "var(--sf-line)" }}>
              <button
                type="button"
                aria-label={`Decrease quantity of ${item.name}`}
                disabled={busy}
                onClick={() => updateItem(item.id, { quantity: item.quantity - 1 })}
                className="px-2.5 py-1 text-[15px]"
                style={{ color: "var(--sf-text)" }}
              >
                −
              </button>
              <span className="min-w-7 text-center text-[13px] font-semibold" style={{ color: "var(--sf-text)" }}>
                {item.quantity}
              </span>
              <button
                type="button"
                aria-label={`Increase quantity of ${item.name}`}
                disabled={busy || (item.availableStock !== null && item.quantity >= item.availableStock)}
                onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                className="px-2.5 py-1 text-[15px] disabled:opacity-40"
                style={{ color: "var(--sf-text)" }}
              >
                +
              </button>
            </div>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => updateItem(item.id, { savedForLater: !saved })}
            className="text-[12.5px] font-medium hover:opacity-75"
            style={{ color: "var(--sf-primary)" }}
          >
            {saved ? "Move to cart" : "Save for later"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => updateItem(item.id, { quantity: 0 })}
            className="text-[12.5px] font-medium hover:opacity-75"
            style={{ color: "#EF4444" }}
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );

  if (cart.items.length === 0 && cart.savedItems.length === 0) {
    return (
      <div
        className="mt-8 border px-6 py-16 text-center"
        style={{ borderRadius: "var(--sf-radius)", borderColor: "var(--sf-line)" }}
      >
        <p className="text-lg font-semibold" style={{ color: "var(--sf-text)" }}>Your cart is empty</p>
        <p className="mt-1 text-[14px]" style={{ color: "var(--sf-text-dim)" }}>
          Browse the catalog to find something you like.
        </p>
        <Link
          href={`/shop/${slug}/products`}
          className="mt-6 inline-flex px-6 py-3 text-[14px] font-semibold text-white"
          style={{ background: "var(--sf-primary)", borderRadius: "var(--sf-btn-radius)" }}
        >
          Shop products
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <ul className="space-y-3">{cart.items.map((i) => row(i, false))}</ul>

        {cart.savedItems.length > 0 ? (
          <div className="mt-10">
            <h2 className="mb-3 text-[15px] font-semibold" style={{ color: "var(--sf-text)" }}>
              Saved for later ({cart.savedItems.length})
            </h2>
            <ul className="space-y-3">{cart.savedItems.map((i) => row(i, true))}</ul>
          </div>
        ) : null}
      </div>

      <aside
        className="h-fit border p-5"
        style={{ borderRadius: "var(--sf-radius)", borderColor: "var(--sf-card-border)", background: "var(--sf-surface)" }}
        aria-label="Order summary"
      >
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--sf-text)" }}>Summary</h2>

        <dl className="mt-4 space-y-2 text-[13.5px]">
          <div className="flex justify-between">
            <dt style={{ color: "var(--sf-text-dim)" }}>Subtotal ({cart.itemCount} item{cart.itemCount === 1 ? "" : "s"})</dt>
            <dd className="font-semibold" style={{ color: "var(--sf-text)" }}>{formatMoney(cart.subtotalCents, currency)}</dd>
          </div>
          <p className="text-[12px]" style={{ color: "var(--sf-text-dim)" }}>
            Shipping, tax, and discounts are calculated at checkout.
          </p>
        </dl>

        <div className="mt-4 space-y-2">
          <label htmlFor="cart-discount" className="block text-[12.5px] font-medium" style={{ color: "var(--sf-text)" }}>
            Promo code
          </label>
          <input
            id="cart-discount"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="e.g. WELCOME10"
            className="w-full px-3 py-2 text-[13.5px] uppercase outline-none"
            style={{ borderRadius: "8px", border: "1px solid var(--sf-line)", background: "var(--sf-bg)", color: "var(--sf-text)" }}
          />
          <label htmlFor="cart-giftcard" className="block text-[12.5px] font-medium" style={{ color: "var(--sf-text)" }}>
            Gift card
          </label>
          <input
            id="cart-giftcard"
            value={giftCardCode}
            onChange={(e) => setGiftCardCode(e.target.value)}
            placeholder="Gift card code"
            className="w-full px-3 py-2 text-[13.5px] uppercase outline-none"
            style={{ borderRadius: "8px", border: "1px solid var(--sf-line)", background: "var(--sf-bg)", color: "var(--sf-text)" }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={applyCodes}
            className="w-full border px-4 py-2 text-[13px] font-semibold disabled:opacity-50"
            style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "var(--sf-primary)", color: "var(--sf-primary)" }}
          >
            Apply codes
          </button>
        </div>

        {error ? (
          <p role="alert" className="mt-3 text-[13px] font-medium" style={{ color: "#EF4444" }}>
            {error}
          </p>
        ) : null}

        <Link
          href={cart.items.length > 0 ? `/shop/${slug}/checkout` : "#"}
          aria-disabled={cart.items.length === 0}
          className="mt-5 block w-full px-4 py-3 text-center text-[14px] font-semibold text-white"
          style={{
            background: "var(--sf-primary)",
            borderRadius: "var(--sf-btn-radius)",
            opacity: cart.items.length === 0 ? 0.5 : 1,
            pointerEvents: cart.items.length === 0 ? "none" : "auto",
          }}
        >
          Proceed to checkout
        </Link>
      </aside>
    </div>
  );
}
