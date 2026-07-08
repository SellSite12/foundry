"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { api } from "@/lib/client/api";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  reply: string | null;
  createdAt: string;
  product: { name: string; slug: string; store: { name: string; slug: string } };
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting moderation",
  PUBLISHED: "Published",
  HIDDEN: "Hidden by seller",
};

export function MyReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ reviews: Review[] }>("/api/account/reviews").then((res) => {
      if (res.ok) setReviews(res.data.reviews);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="mt-8 animate-pulse space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-line bg-surface" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="mt-8 rounded-2xl border border-line px-6 py-16 text-center text-[13.5px] text-ink-dim">
        You haven't written any reviews yet. After buying something, share your experience on the product page.
      </p>
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href={`/shop/${r.product.store.slug}/products/${r.product.slug}`}
              className="text-[14px] font-semibold hover:text-copper"
            >
              {r.product.name}
            </Link>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
                r.status === "PUBLISHED"
                  ? "bg-success-soft text-success"
                  : r.status === "PENDING"
                    ? "bg-copper/12 text-copper"
                    : "bg-danger-soft text-danger"
              }`}
            >
              {STATUS_LABEL[r.status] ?? r.status}
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-ink-dim">
            {r.product.store.name} · {new Date(r.createdAt).toLocaleDateString()}
          </p>
          <p className="mt-2 text-[13px]" aria-label={`Rated ${r.rating} out of 5`}>
            <span className="text-copper">{"★".repeat(r.rating)}</span>
            <span className="text-line">{"★".repeat(5 - r.rating)}</span>
          </p>
          {r.title ? <p className="mt-1 text-[14px] font-medium">{r.title}</p> : null}
          {r.body ? <p className="mt-1 text-[13.5px] leading-relaxed text-ink-dim">{r.body}</p> : null}
          {r.reply ? (
            <p className="mt-2 border-l-2 border-copper pl-3 text-[13px] text-ink-dim">
              <span className="font-semibold text-ink">Seller replied: </span>
              {r.reply}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
