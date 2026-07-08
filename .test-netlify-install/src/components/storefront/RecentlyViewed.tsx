"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Entry = {
  slug: string;
  name: string;
  priceLabel: string;
  imageUrl: string | null;
  storeSlug: string;
};

const KEY = "foundry_recently_viewed";
const MAX = 8;

function readEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Entry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Records the current product in localStorage and shows the visitor's
 * other recently viewed products (client-side personal data — kept local).
 */
export function RecentlyViewed({ current }: { current: Entry }) {
  const [others, setOthers] = useState<Entry[]>([]);

  useEffect(() => {
    const entries = readEntries().filter(
      (e) => !(e.slug === current.slug && e.storeSlug === current.storeSlug)
    );
    setOthers(entries.slice(0, MAX));
    localStorage.setItem(KEY, JSON.stringify([current, ...entries].slice(0, MAX + 1)));
  }, [current]);

  if (others.length === 0) return null;

  return (
    <section aria-label="Recently viewed" className="mt-14">
      <h2 className="mb-5 text-xl font-semibold tracking-tight" style={{ color: "var(--sf-text)" }}>
        Recently viewed
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {others.map((e) => (
          <Link
            key={`${e.storeSlug}/${e.slug}`}
            href={`/shop/${e.storeSlug}/products/${e.slug}`}
            className="w-40 shrink-0 border transition-transform hover:-translate-y-0.5"
            style={{ borderRadius: "var(--sf-radius)", borderColor: "var(--sf-card-border)", background: "var(--sf-surface)" }}
          >
            <div className="aspect-square overflow-hidden" style={{ borderRadius: "var(--sf-radius) var(--sf-radius) 0 0" }}>
              {e.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.imageUrl} alt={e.name} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl" aria-hidden style={{ color: "var(--sf-text-dim)", opacity: 0.4 }}>◇</div>
              )}
            </div>
            <div className="p-3">
              <p className="line-clamp-1 text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>{e.name}</p>
              <p className="text-[12.5px] font-semibold" style={{ color: "var(--sf-text-dim)" }}>{e.priceLabel}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
