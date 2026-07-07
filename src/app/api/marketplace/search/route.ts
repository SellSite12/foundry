import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { ok, withErrorHandling } from "@/lib/api";
import {
  marketplaceProductWhere,
  MARKETPLACE_CARD_SELECT,
  toCard,
  unitsSoldByProduct,
} from "@/lib/shop/marketplace";

const PAGE_SIZE = 24;

/**
 * Marketplace search + browse. All filters hit indexed columns.
 *   q          text query (products, sellers)
 *   category   exact category
 *   store      store slug
 *   min, max   price bounds in cents
 *   stock      "in" = in-stock only
 *   sort       relevance | newest | price_asc | price_desc | rating | bestselling
 *   page       1-based
 *   mode       "suggest" returns lightweight autocomplete groups
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const mode = sp.get("mode");

  if (mode === "suggest") {
    if (q.length < 2) return ok({ products: [], sellers: [], categories: [] });
    const [products, sellers, categories] = await Promise.all([
      db.product.findMany({
        where: { ...marketplaceProductWhere(), name: { contains: q } },
        take: 6,
        orderBy: { updatedAt: "desc" },
        select: {
          name: true,
          slug: true,
          priceCents: true,
          currency: true,
          images: { orderBy: { position: "asc" }, take: 1 },
          store: { select: { slug: true } },
        },
      }),
      db.store.findMany({
        where: { status: "ACTIVE", onboardingDone: true, name: { contains: q } },
        take: 4,
        select: { name: true, slug: true, logo: true, industry: true },
      }),
      db.product.groupBy({
        by: ["category"],
        where: { ...marketplaceProductWhere(), category: { contains: q } },
        _count: { _all: true },
        orderBy: { _count: { category: "desc" } },
        take: 4,
      }),
    ]);
    return ok({
      products: products.map((p) => ({
        name: p.name,
        href: `/shop/${p.store.slug}/products/${p.slug}`,
        priceCents: p.priceCents,
        currency: p.currency,
        imageUrl: p.images[0]?.url ?? null,
      })),
      sellers: sellers.map((s) => ({
        name: s.name,
        href: `/marketplace/sellers/${s.slug}`,
        logo: s.logo,
        industry: s.industry,
      })),
      categories: categories
        .filter((c) => c.category)
        .map((c) => ({
          name: c.category as string,
          href: `/marketplace/search?category=${encodeURIComponent(c.category as string)}`,
          count: c._count._all,
        })),
    });
  }

  const category = sp.get("category")?.trim();
  const storeSlug = sp.get("store")?.trim();
  const min = parseInt(sp.get("min") ?? "", 10);
  const max = parseInt(sp.get("max") ?? "", 10);
  const inStockOnly = sp.get("stock") === "in";
  const sort = sp.get("sort") ?? "relevance";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);

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
    ...(category && { category }),
    ...(storeSlug && { store: { slug: storeSlug, status: "ACTIVE", onboardingDone: true } }),
    ...(Number.isFinite(min) && { priceCents: { gte: min } }),
    ...(Number.isFinite(max) && {
      priceCents: { ...(Number.isFinite(min) ? { gte: min } : {}), lte: max },
    }),
    ...(inStockOnly && { OR: [{ trackInventory: false }, { stock: { gt: 0 } }] }),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "newest"
      ? { createdAt: "desc" }
      : sort === "price_asc"
        ? { priceCents: "asc" }
        : sort === "price_desc"
          ? { priceCents: "desc" }
          : { updatedAt: "desc" }; // relevance/rating/bestselling re-ranked below

  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy,
      // rating/bestselling need a wider candidate set to re-rank fairly
      take: sort === "rating" || sort === "bestselling" ? PAGE_SIZE * 4 : PAGE_SIZE,
      skip: sort === "rating" || sort === "bestselling" ? 0 : (page - 1) * PAGE_SIZE,
      select: MARKETPLACE_CARD_SELECT,
    }),
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

  return ok({
    products: cards,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
});
