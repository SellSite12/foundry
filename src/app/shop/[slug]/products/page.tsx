import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import {
  getLiveStore,
  publicProductWhere,
  PUBLIC_PRODUCT_CARD_SELECT,
  ratingSummary,
  trackVisit,
} from "@/lib/shop/storefront";
import { ProductCard, EmptyNote } from "@/components/storefront/ui";

export const metadata = { title: "Products" };

const PAGE_SIZE = 24;

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; category?: string; sort?: string; page?: string; collection?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const store = await getLiveStore(slug);
  if (!store) notFound();
  await trackVisit(store.id, `/shop/${slug}/products`);

  const q = sp.q?.trim();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const sort = sp.sort ?? "newest";

  const where: Prisma.ProductWhereInput = {
    ...publicProductWhere(store.id),
    ...(q && {
      AND: [{ OR: [{ name: { contains: q } }, { tags: { contains: q } }, { category: { contains: q } }] }],
    }),
    ...(sp.category && { category: sp.category }),
    ...(sp.collection && { collection: { slug: sp.collection } }),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc"
      ? { priceCents: "asc" }
      : sort === "price_desc"
        ? { priceCents: "desc" }
        : sort === "name"
          ? { name: "asc" }
          : { createdAt: "desc" };

  const [total, products, categories] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy,
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: PUBLIC_PRODUCT_CARD_SELECT,
    }),
    db.product.groupBy({
      by: ["category"],
      where: { ...publicProductWhere(store.id), category: { not: null } },
      _count: { _all: true },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildQuery = (patch: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    const merged = { q, category: sp.category, sort, collection: sp.collection, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) query.set(k, v);
    const s = query.toString();
    return `/shop/${slug}/products${s ? `?${s}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--sf-text)" }}>
        {sp.collection ? "Collection" : sp.category ?? "All products"}
      </h1>
      <p className="mt-1 text-[13px]" style={{ color: "var(--sf-text-dim)" }}>
        {total} product{total === 1 ? "" : "s"}
      </p>

      {/* Search + sort toolbar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form action={`/shop/${slug}/products`} method="get" role="search" className="flex max-w-sm flex-1 gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search products…"
            aria-label="Search products"
            className="w-full border px-3.5 py-2 text-[14px] outline-none"
            style={{
              borderRadius: "var(--sf-btn-radius)",
              borderColor: "var(--sf-line)",
              background: "var(--sf-surface)",
              color: "var(--sf-text)",
            }}
          />
          {sp.category ? <input type="hidden" name="category" value={sp.category} /> : null}
          <button
            type="submit"
            className="px-4 py-2 text-[13.5px] font-semibold text-white"
            style={{ background: "var(--sf-primary)", borderRadius: "var(--sf-btn-radius)" }}
          >
            Search
          </button>
        </form>

        <nav aria-label="Sort products" className="flex flex-wrap items-center gap-1.5 text-[13px]">
          {[
            ["newest", "Newest"],
            ["price_asc", "Price ↑"],
            ["price_desc", "Price ↓"],
            ["name", "A–Z"],
          ].map(([key, label]) => (
            <Link
              key={key}
              href={buildQuery({ sort: key, page: undefined })}
              aria-current={sort === key ? "true" : undefined}
              className="border px-3 py-1.5 font-medium transition-colors"
              style={{
                borderRadius: "var(--sf-btn-radius)",
                borderColor: sort === key ? "var(--sf-primary)" : "var(--sf-line)",
                color: sort === key ? "var(--sf-primary)" : "var(--sf-text-dim)",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Category filter rail */}
      {categories.length > 0 ? (
        <nav aria-label="Filter by category" className="mt-4 flex flex-wrap gap-1.5 text-[13px]">
          <Link
            href={buildQuery({ category: undefined, page: undefined })}
            className="border px-3 py-1.5 font-medium"
            style={{
              borderRadius: "999px",
              borderColor: !sp.category ? "var(--sf-primary)" : "var(--sf-line)",
              color: !sp.category ? "var(--sf-primary)" : "var(--sf-text-dim)",
            }}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.category}
              href={buildQuery({ category: c.category as string, page: undefined })}
              className="border px-3 py-1.5 font-medium"
              style={{
                borderRadius: "999px",
                borderColor: sp.category === c.category ? "var(--sf-primary)" : "var(--sf-line)",
                color: sp.category === c.category ? "var(--sf-primary)" : "var(--sf-text-dim)",
              }}
            >
              {c.category} ({c._count._all})
            </Link>
          ))}
        </nav>
      ) : null}

      {/* Grid */}
      <div className="mt-8">
        {products.length === 0 ? (
          <EmptyNote>
            {q ? `Nothing matches “${q}”. Try a different search.` : "No products here yet."}
          </EmptyNote>
        ) : (
          <div className="sf-product-grid grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  name: p.name,
                  slug: p.slug,
                  priceCents: p.priceCents,
                  compareAtCents: p.compareAtCents,
                  currency: p.currency,
                  imageUrl: p.images[0]?.url ?? null,
                  inStock: !p.trackInventory || p.stock > 0,
                  rating: ratingSummary(p.reviews),
                  storeSlug: slug,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 ? (
        <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2 text-[13.5px]">
          {page > 1 ? (
            <Link href={buildQuery({ page: String(page - 1) })} className="border px-4 py-2" style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "var(--sf-line)", color: "var(--sf-text)" }}>
              ← Previous
            </Link>
          ) : null}
          <span style={{ color: "var(--sf-text-dim)" }}>
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={buildQuery({ page: String(page + 1) })} className="border px-4 py-2" style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "var(--sf-line)", color: "var(--sf-text)" }}>
              Next →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
