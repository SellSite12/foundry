import Link from "next/link";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  marketplaceProductWhere,
  MARKETPLACE_CARD_SELECT,
  toCard,
  unitsSoldByProduct,
  marketplaceCategories,
} from "@/lib/shop/marketplace";
import { ProductCard, EmptyNote } from "@/components/storefront/ui";

export const metadata = { title: "Browse" };

const PAGE_SIZE = 24;

type Search = {
  q?: string;
  category?: string;
  store?: string;
  min?: string;
  max?: string;
  stock?: string;
  sort?: string;
  page?: string;
};

export default async function MarketplaceSearchPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const sort = sp.sort ?? (q ? "relevance" : "newest");
  const minCents = sp.min ? Math.round(parseFloat(sp.min) * 100) : null;
  const maxCents = sp.max ? Math.round(parseFloat(sp.max) * 100) : null;

  const where: Prisma.ProductWhereInput = {
    ...marketplaceProductWhere(),
    ...(q && {
      AND: [
        {
          OR: [
            { name: { contains: q } },
            { tags: { contains: q } },
            { category: { contains: q } },
            { store: { name: { contains: q } } },
          ],
        },
      ],
    }),
    ...(sp.category && { category: sp.category }),
    ...(sp.store && { store: { slug: sp.store, status: "ACTIVE", onboardingDone: true } }),
    ...(minCents !== null && Number.isFinite(minCents) && { priceCents: { gte: minCents } }),
    ...(maxCents !== null &&
      Number.isFinite(maxCents) && {
        priceCents: {
          ...(minCents !== null && Number.isFinite(minCents) ? { gte: minCents } : {}),
          lte: maxCents,
        },
      }),
    ...(sp.stock === "in" && { OR: [{ trackInventory: false }, { stock: { gt: 0 } }] }),
  };

  const wideRank = sort === "rating" || sort === "bestselling";
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc"
      ? { priceCents: "asc" }
      : sort === "price_desc"
        ? { priceCents: "desc" }
        : sort === "newest"
          ? { createdAt: "desc" }
          : { updatedAt: "desc" };

  const [total, rows, categories] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy,
      take: wideRank ? PAGE_SIZE * 4 : PAGE_SIZE,
      skip: wideRank ? 0 : (page - 1) * PAGE_SIZE,
      select: MARKETPLACE_CARD_SELECT,
    }),
    marketplaceCategories(),
  ]);

  let cards = rows.map(toCard);
  if (sort === "rating") {
    cards = cards
      .sort((a, b) => (b.rating.average ?? 0) - (a.rating.average ?? 0) || b.rating.count - a.rating.count)
      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  } else if (sort === "bestselling") {
    const sold = await unitsSoldByProduct();
    cards = cards
      .sort((a, b) => (sold.get(b.id) ?? 0) - (sold.get(a.id) ?? 0))
      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildQuery = (patch: Partial<Search>) => {
    const query = new URLSearchParams();
    const merged: Search = { ...sp, ...patch };
    delete merged.page;
    if (patch.page) merged.page = patch.page;
    for (const [k, v] of Object.entries(merged)) if (v) query.set(k, v);
    const s = query.toString();
    return `/marketplace/search${s ? `?${s}` : ""}`;
  };

  const sorts: [string, string][] = [
    ["newest", "Newest"],
    ["bestselling", "Best selling"],
    ["rating", "Top rated"],
    ["price_asc", "Price ↑"],
    ["price_desc", "Price ↓"],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-ink">
        {q ? `Results for “${q}”` : sp.category ?? "Browse products"}
      </h1>
      <p className="mt-1 text-[13px] text-ink-dim">
        {total} product{total === 1 ? "" : "s"} from independent sellers
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Filters */}
        <aside aria-label="Filters" className="h-fit rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-dim">Filters</h2>

          <form action="/marketplace/search" method="get" className="mt-4 flex flex-col gap-4">
            {q ? <input type="hidden" name="q" value={q} /> : null}
            {sp.category ? <input type="hidden" name="category" value={sp.category} /> : null}
            {sp.sort ? <input type="hidden" name="sort" value={sp.sort} /> : null}

            <div>
              <label className="mb-1.5 block text-[12.5px] font-medium text-ink">Price range</label>
              <div className="flex items-center gap-2">
                <input
                  name="min"
                  defaultValue={sp.min}
                  placeholder="Min"
                  inputMode="decimal"
                  aria-label="Minimum price"
                  className="w-full rounded-lg border border-line bg-base px-2.5 py-2 text-[13px] text-ink outline-none"
                />
                <span className="text-ink-dim">–</span>
                <input
                  name="max"
                  defaultValue={sp.max}
                  placeholder="Max"
                  inputMode="decimal"
                  aria-label="Maximum price"
                  className="w-full rounded-lg border border-line bg-base px-2.5 py-2 text-[13px] text-ink outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-[13px] text-ink">
              <input type="checkbox" name="stock" value="in" defaultChecked={sp.stock === "in"} />
              In stock only
            </label>

            <button
              type="submit"
              className="rounded-lg bg-copper px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Apply filters
            </button>
            {(sp.min || sp.max || sp.stock) ? (
              <Link href={buildQuery({ min: undefined, max: undefined, stock: undefined })} className="text-center text-[12.5px] font-medium text-ink-dim hover:text-ink">
                Clear filters
              </Link>
            ) : null}
          </form>

          {categories.length > 0 ? (
            <nav aria-label="Categories" className="mt-6 border-t border-line pt-4">
              <h3 className="mb-2 text-[12.5px] font-semibold text-ink">Categories</h3>
              <ul className="space-y-1 text-[13px]">
                <li>
                  <Link href={buildQuery({ category: undefined })} className={!sp.category ? "font-semibold text-copper" : "text-ink-dim hover:text-ink"}>
                    All categories
                  </Link>
                </li>
                {categories.slice(0, 15).map((c) => (
                  <li key={c.name}>
                    <Link
                      href={buildQuery({ category: c.name })}
                      className={sp.category === c.name ? "font-semibold text-copper" : "text-ink-dim hover:text-ink"}
                    >
                      {c.name} <span className="opacity-60">({c.count})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </aside>

        {/* Results */}
        <div>
          <nav aria-label="Sort" className="mb-5 flex flex-wrap gap-1.5 text-[13px]">
            {sorts.map(([key, label]) => (
              <Link
                key={key}
                href={buildQuery({ sort: key })}
                aria-current={sort === key ? "true" : undefined}
                className={`rounded-full border px-3.5 py-1.5 font-medium transition-colors ${
                  sort === key ? "border-copper text-copper" : "border-line text-ink-dim hover:text-ink"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {cards.length === 0 ? (
            <EmptyNote>
              Nothing matches these filters.{" "}
              <Link href="/marketplace/search" className="font-medium" style={{ color: "var(--sf-primary)" }}>
                Browse everything
              </Link>
            </EmptyNote>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {cards.map((p) => (
                <ProductCard key={p.id} product={p} showStore />
              ))}
            </div>
          )}

          {pageCount > 1 ? (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3 text-[13.5px]">
              {page > 1 ? (
                <Link href={buildQuery({ page: String(page - 1) })} className="rounded-lg border border-line px-4 py-2 text-ink hover:border-copper">
                  ← Previous
                </Link>
              ) : null}
              <span className="text-ink-dim">Page {page} of {pageCount}</span>
              {page < pageCount ? (
                <Link href={buildQuery({ page: String(page + 1) })} className="rounded-lg border border-line px-4 py-2 text-ink hover:border-copper">
                  Next →
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
