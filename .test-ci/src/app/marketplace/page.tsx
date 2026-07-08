import Link from "next/link";

import { db } from "@/lib/db";
import {
  marketplaceProductWhere,
  MARKETPLACE_CARD_SELECT,
  toCard,
  unitsSoldByProduct,
  marketplaceCategories,
  featuredSellers,
} from "@/lib/shop/marketplace";
import { ProductCard, SectionHeading, EmptyNote } from "@/components/storefront/ui";

export default async function MarketplaceHome() {
  const [newArrivals, soldAllTime, soldRecent, categories, sellers] = await Promise.all([
    db.product.findMany({
      where: marketplaceProductWhere(),
      orderBy: { createdAt: "desc" },
      take: 8,
      select: MARKETPLACE_CARD_SELECT,
    }),
    unitsSoldByProduct(),
    unitsSoldByProduct(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    marketplaceCategories(),
    featuredSellers(6),
  ]);

  // Trending = most units sold in the last 30 days; best sellers = all time.
  const rankedIds = (sold: Map<string, number>) =>
    [...sold.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id]) => id);

  const [trendingRows, bestRows] = await Promise.all([
    db.product.findMany({
      where: { ...marketplaceProductWhere(), id: { in: rankedIds(soldRecent) } },
      select: MARKETPLACE_CARD_SELECT,
    }),
    db.product.findMany({
      where: { ...marketplaceProductWhere(), id: { in: rankedIds(soldAllTime) } },
      select: MARKETPLACE_CARD_SELECT,
    }),
  ]);
  const trending = trendingRows
    .map(toCard)
    .sort((a, b) => (soldRecent.get(b.id) ?? 0) - (soldRecent.get(a.id) ?? 0));
  const bestSellers = bestRows
    .map(toCard)
    .sort((a, b) => (soldAllTime.get(b.id) ?? 0) - (soldAllTime.get(a.id) ?? 0));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* Hero */}
      <section className="mt-10 rounded-2xl bg-gradient-to-br from-copper/15 via-transparent to-transparent px-8 py-14 text-center">
        <h1 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-ink sm:text-5xl">
          Shop independent stores, all in one place
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-ink-dim">
          Every product here is made and sold by an independent Foundry seller.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/marketplace/search"
            className="rounded-xl bg-copper px-6 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Browse all products
          </Link>
          <Link
            href="/signup"
            className="rounded-xl border border-line px-6 py-3 text-[14px] font-semibold text-ink transition-colors hover:border-copper hover:text-copper"
          >
            Become a seller
          </Link>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 ? (
        <section className="mt-14" aria-label="Categories">
          <SectionHeading title="Shop by category" />
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 12).map((c) => (
              <Link
                key={c.name}
                href={`/marketplace/search?category=${encodeURIComponent(c.name)}`}
                className="rounded-full border border-line px-4 py-2 text-[13.5px] font-medium text-ink-dim transition-colors hover:border-copper hover:text-copper"
              >
                {c.name} <span className="opacity-60">({c.count})</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Trending */}
      {trending.length > 0 ? (
        <section className="mt-14" aria-label="Trending products">
          <SectionHeading
            title="Trending now"
            action={<Link href="/marketplace/search?sort=bestselling" className="text-[13px] font-medium text-copper hover:opacity-80">View all →</Link>}
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {trending.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} showStore />
            ))}
          </div>
        </section>
      ) : null}

      {/* New arrivals */}
      <section className="mt-14" aria-label="New arrivals">
        <SectionHeading
          title="New arrivals"
          action={<Link href="/marketplace/search?sort=newest" className="text-[13px] font-medium text-copper hover:opacity-80">View all →</Link>}
        />
        {newArrivals.length === 0 ? (
          <EmptyNote>No products in the marketplace yet — sellers are setting up shop.</EmptyNote>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={toCard(p)} showStore />
            ))}
          </div>
        )}
      </section>

      {/* Best sellers */}
      {bestSellers.length > 0 ? (
        <section className="mt-14" aria-label="Best sellers">
          <SectionHeading
            title="Best sellers"
            action={<Link href="/marketplace/search?sort=bestselling" className="text-[13px] font-medium text-copper hover:opacity-80">View all →</Link>}
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {bestSellers.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} showStore />
            ))}
          </div>
        </section>
      ) : null}

      {/* Featured sellers */}
      {sellers.length > 0 ? (
        <section className="mt-14" aria-label="Featured sellers">
          <SectionHeading title="Featured sellers" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sellers.map((s) => (
              <Link
                key={s.id}
                href={`/marketplace/sellers/${s.slug}`}
                className="group flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 transition-transform hover:-translate-y-0.5"
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg font-bold text-white"
                  style={{ background: s.brandColor }}
                  aria-hidden
                >
                  {s.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    s.name.charAt(0).toUpperCase()
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold text-ink group-hover:text-copper">
                    {s.name}
                  </span>
                  {s.industry ? <span className="block text-[12.5px] text-ink-dim">{s.industry}</span> : null}
                  <span className="mt-1 block text-[12.5px] text-ink-dim">
                    {s.productCount} product{s.productCount === 1 ? "" : "s"}
                    {s.orderCount > 0 ? ` · ${s.orderCount} order${s.orderCount === 1 ? "" : "s"}` : ""}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
