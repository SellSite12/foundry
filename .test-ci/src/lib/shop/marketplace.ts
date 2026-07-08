// Cross-seller marketplace queries. Only live stores (active + onboarded)
// and public products (published, visible, publish date reached) surface.

import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { ratingSummary } from "@/lib/shop/storefront";

export function marketplaceProductWhere(): Prisma.ProductWhereInput {
  return {
    status: "PUBLISHED",
    visibility: "VISIBLE",
    OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
    store: { status: "ACTIVE", onboardingDone: true },
  };
}

export const MARKETPLACE_CARD_SELECT = {
  id: true,
  name: true,
  slug: true,
  priceCents: true,
  compareAtCents: true,
  currency: true,
  category: true,
  createdAt: true,
  trackInventory: true,
  stock: true,
  images: { orderBy: { position: "asc" as const }, take: 1 },
  reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
  store: { select: { id: true, name: true, slug: true, brandColor: true } },
} as const;

type CardRow = Prisma.ProductGetPayload<{ select: typeof MARKETPLACE_CARD_SELECT }>;

export function toCard(p: CardRow) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    currency: p.currency,
    category: p.category,
    imageUrl: p.images[0]?.url ?? null,
    inStock: !p.trackInventory || p.stock > 0,
    rating: ratingSummary(p.reviews),
    storeName: p.store.name,
    storeSlug: p.store.slug,
  };
}

export type MarketplaceCard = ReturnType<typeof toCard>;

/** Units sold per product (paid orders), for trending/best-seller ranking. */
export async function unitsSoldByProduct(since?: Date): Promise<Map<string, number>> {
  const grouped = await db.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: { paidAt: since ? { gte: since } : { not: null } },
    },
    _sum: { quantity: true },
  });
  return new Map(grouped.map((g) => [g.productId, g._sum.quantity ?? 0]));
}

/** Distinct product categories across the live marketplace, with counts. */
export async function marketplaceCategories(): Promise<{ name: string; count: number }[]> {
  const grouped = await db.product.groupBy({
    by: ["category"],
    where: { ...marketplaceProductWhere(), category: { not: null } },
    _count: { _all: true },
  });
  return grouped
    .filter((g) => g.category)
    .map((g) => ({ name: g.category as string, count: g._count._all }))
    .sort((a, b) => b.count - a.count);
}

/** Stores ranked by lifetime paid revenue — the "featured sellers" rail. */
export async function featuredSellers(limit = 8) {
  const revenue = await db.order.groupBy({
    by: ["storeId"],
    where: { paidAt: { not: null } },
    _sum: { totalCents: true },
    _count: { _all: true },
  });
  const revenueMap = new Map(revenue.map((r) => [r.storeId, r]));

  const stores = await db.store.findMany({
    where: { status: "ACTIVE", onboardingDone: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
      brandColor: true,
      industry: true,
      createdAt: true,
      _count: {
        select: {
          products: { where: { status: "PUBLISHED", visibility: "VISIBLE" } },
          reviews: { where: { status: "PUBLISHED" } },
        },
      },
    },
  });

  return stores
    .filter((s) => s._count.products > 0)
    .map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      logo: s.logo,
      brandColor: s.brandColor,
      industry: s.industry,
      productCount: s._count.products,
      reviewCount: s._count.reviews,
      orderCount: revenueMap.get(s.id)?._count._all ?? 0,
      revenueCents: revenueMap.get(s.id)?._sum.totalCents ?? 0,
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents || b.productCount - a.productCount)
    .slice(0, limit);
}
