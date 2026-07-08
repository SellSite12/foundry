"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { api } from "@/lib/client/api";
import { formatMoney } from "@/lib/money";

type Item = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  imageUrl: string | null;
  available: boolean;
  rating: { average: number | null; count: number };
  storeName: string;
  storeSlug: string;
};

export function WishlistGrid() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await api<{ items: Item[] }>("/api/account/wishlist");
    if (res.ok) setItems(res.data.items);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    const res = await api(`/api/account/wishlist?id=${id}`, { method: "DELETE" });
    if (res.ok) setItems((arr) => arr.filter((i) => i.id !== id));
  }

  if (loading) {
    return (
      <div className="mt-8 grid animate-pulse grid-cols-2 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl border border-line bg-surface" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-line px-6 py-16 text-center">
        <p className="text-[15px] font-semibold">Your wishlist is empty</p>
        <p className="mt-1 text-[13.5px] text-ink-dim">
          Tap “Save” on any product to keep it here.
        </p>
        <Link
          href="/marketplace"
          className="mt-6 inline-flex rounded-xl bg-copper px-5 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Browse the marketplace
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
          <Link href={`/shop/${item.storeSlug}/products/${item.slug}`} className="block">
            <div className="relative aspect-square bg-base">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl text-ink-faint" aria-hidden>◇</div>
              )}
              {!item.available ? (
                <span className="absolute left-2 top-2 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-dim">
                  Unavailable
                </span>
              ) : null}
            </div>
          </Link>
          <div className="p-3.5">
            <p className="text-[11px] uppercase tracking-wide text-ink-dim">{item.storeName}</p>
            <Link href={`/shop/${item.storeSlug}/products/${item.slug}`} className="mt-0.5 line-clamp-1 block text-[14px] font-medium hover:text-copper">
              {item.name}
            </Link>
            <p className="mt-1 text-[13.5px] font-semibold">{formatMoney(item.priceCents, item.currency)}</p>
            <button
              onClick={() => remove(item.id)}
              className="mt-2 text-[12.5px] font-medium text-danger hover:opacity-80"
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
