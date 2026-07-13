import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getLiveStore } from "@/lib/shop/storefront";
import {
  marketplaceProductWhere,
  MARKETPLACE_CARD_SELECT,
  toCard,
} from "@/lib/shop/marketplace";
import { ProductCard, EmptyNote, Stars } from "@/components/storefront/ui";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  return store ? { title: store.name, description: store.description ?? undefined } : {};
}

export default async function SellerProfilePage({ params }: { params: Params }) {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) notFound();

  const [products, reviewAgg, orderCount] = await Promise.all([
    db.product.findMany({
      where: { ...marketplaceProductWhere(), storeId: store.id },
      orderBy: { updatedAt: "desc" },
      take: 24,
      select: MARKETPLACE_CARD_SELECT,
    }),
    db.review.aggregate({
      where: { storeId: store.id, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    db.order.count({ where: { storeId: store.id, paidAt: { not: null } } }),
  ]);

  const memberSince = store.createdAt.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Seller header */}
      <section className="flex flex-col items-start gap-5 rounded-2xl border border-line bg-surface p-7 sm:flex-row sm:items-center">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-2xl font-bold text-white"
          style={{ background: store.brandColor }}
          aria-hidden
        >
          {store.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logo} alt="" className="h-full w-full object-cover" />
          ) : (
            store.name.charAt(0).toUpperCase()
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{store.name}</h1>
          {store.description ? (
            <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-ink-dim">{store.description}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-dim">
            {store.industry ? <span>{store.industry}</span> : null}
            {store.city && store.country ? <span>{store.city}, {store.country}</span> : null}
            <span>Member since {memberSince}</span>
            <span>{orderCount} order{orderCount === 1 ? "" : "s"} fulfilled</span>
            {reviewAgg._count._all > 0 ? (
              <Stars
                average={Math.round((reviewAgg._avg.rating ?? 0) * 10) / 10}
                count={reviewAgg._count._all}
              />
            ) : null}
          </div>
        </div>
        <Link
          href={`/shop/${store.slug}`}
          className="shrink-0 rounded-xl bg-copper px-5 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Visit storefront
        </Link>
      </section>

      {/* Products */}
      <section className="mt-10" aria-label="Products from this seller">
        <h2 className="mb-5 text-xl font-semibold tracking-tight text-ink">
          Products ({products.length})
        </h2>
        {products.length === 0 ? (
          <EmptyNote>This seller hasn&apos;t published any products yet.</EmptyNote>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={toCard(p)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
