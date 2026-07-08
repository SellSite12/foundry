"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { api } from "@/lib/client/api";

type CartPayload = { cart: { itemCount: number } };

/**
 * Cart icon with a live item count. Components that mutate the cart
 * dispatch `foundry:cart-updated` with the fresh count so every badge on
 * the page stays in sync without polling.
 */
export function CartBadge({ slug, initialCount }: { slug: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ itemCount?: number }>).detail;
      if (typeof detail?.itemCount === "number") {
        setCount(detail.itemCount);
      } else {
        api<CartPayload>(`/api/shop/${slug}/cart`).then((res) => {
          if (res.ok) setCount(res.data.cart.itemCount);
        });
      }
    };
    window.addEventListener("foundry:cart-updated", onUpdate);
    return () => window.removeEventListener("foundry:cart-updated", onUpdate);
  }, [slug]);

  return (
    <Link
      href={`/shop/${slug}/cart`}
      aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:opacity-80"
      style={{ color: "var(--sf-text)" }}
    >
      <ShoppingBag size={20} aria-hidden />
      {count > 0 ? (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold"
          style={{ background: "var(--sf-primary)", color: "#fff" }}
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

/** Fire this after any cart mutation so badges refresh. */
export function emitCartUpdated(itemCount?: number) {
  window.dispatchEvent(
    new CustomEvent("foundry:cart-updated", { detail: { itemCount } })
  );
}
