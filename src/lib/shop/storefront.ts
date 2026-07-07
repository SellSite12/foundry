import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { trackEvent } from "@/lib/analytics";

/** Resolves a live storefront by slug: active store with finished onboarding. */
export async function getLiveStore(slug: string) {
  const store = await db.store.findUnique({ where: { slug } });
  if (!store || store.status !== "ACTIVE" || !store.onboardingDone) return null;
  return store;
}

/** Where-clause for products a shopper is allowed to see. */
export function publicProductWhere(storeId: string): Prisma.ProductWhereInput {
  return {
    storeId,
    status: "PUBLISHED",
    visibility: "VISIBLE",
    OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
  };
}

export const PUBLIC_PRODUCT_CARD_SELECT = {
  id: true,
  name: true,
  slug: true,
  priceCents: true,
  compareAtCents: true,
  currency: true,
  category: true,
  trackInventory: true,
  stock: true,
  images: { orderBy: { position: "asc" as const }, take: 2 },
  reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
} as const;

export function ratingSummary(reviews: { rating: number }[]): {
  average: number | null;
  count: number;
} {
  if (reviews.length === 0) return { average: null, count: 0 };
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return { average: Math.round(avg * 10) / 10, count: reviews.length };
}

function deviceFromUserAgent(ua: string | null): string {
  if (!ua) return "unknown";
  if (/mobile|iphone|android(?!.*tablet)/i.test(ua)) return "mobile";
  if (/ipad|tablet/i.test(ua)) return "tablet";
  return "desktop";
}

function sourceFromReferer(referer: string | null, host: string | null): string {
  if (!referer) return "direct";
  try {
    const r = new URL(referer);
    if (host && r.host === host) return "internal";
    if (/google|bing|duckduckgo|yahoo/i.test(r.host)) return "search";
    if (/facebook|instagram|twitter|x\.com|tiktok|pinterest|reddit|linkedin/i.test(r.host)) {
      return "social";
    }
    return r.host;
  } catch {
    return "direct";
  }
}

/**
 * Records a storefront visit — the event Phase 3 analytics aggregates into
 * visitors, conversion rate, traffic sources, devices, and top pages.
 * Never throws; analytics must not break page rendering.
 */
export async function trackVisit(storeId: string, path: string): Promise<void> {
  try {
    const hdrs = await headers();
    await trackEvent("storefront.visit", {
      storeId,
      payload: {
        path,
        device: deviceFromUserAgent(hdrs.get("user-agent")),
        source: sourceFromReferer(hdrs.get("referer"), hdrs.get("host")),
        country: hdrs.get("x-vercel-ip-country") ?? hdrs.get("cf-ipcountry") ?? "unknown",
      },
    });
  } catch (error) {
    console.error("[storefront] visit tracking failed:", error);
  }
}

/** Marks internal visits (bots hitting sub-resources are excluded upstream). */
export async function hasPurchased(userId: string, productId: string): Promise<boolean> {
  const item = await db.orderItem.findFirst({
    where: {
      productId,
      order: { customerId: userId, paidAt: { not: null } },
    },
    select: { id: true },
  });
  return Boolean(item);
}
