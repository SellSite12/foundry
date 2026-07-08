import { db } from "@/lib/db";
import { REVENUE_STATUSES } from "@/lib/constants";

export type DateRange = { from: Date; to: Date };

export function rangeFromKey(key: string, from?: string, to?: string): DateRange {
  const now = new Date();
  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const daysAgo = (n: number) => {
    const x = startOfDay(now);
    x.setDate(x.getDate() - n);
    return x;
  };

  switch (key) {
    case "today":
      return { from: startOfDay(now), to: now };
    case "yesterday": {
      const y = daysAgo(1);
      const end = startOfDay(now);
      return { from: y, to: end };
    }
    case "7d":
      return { from: daysAgo(6), to: now };
    case "30d":
      return { from: daysAgo(29), to: now };
    case "90d":
      return { from: daysAgo(89), to: now };
    case "year":
      return { from: daysAgo(364), to: now };
    case "custom": {
      const f = from ? new Date(from) : daysAgo(29);
      const t = to ? new Date(to) : now;
      return {
        from: Number.isNaN(f.getTime()) ? daysAgo(29) : f,
        to: Number.isNaN(t.getTime()) ? now : t,
      };
    }
    default:
      return { from: daysAgo(29), to: now };
  }
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Enumerates each day in the range so charts always have a full axis. */
function daySeries(range: DateRange): string[] {
  const days: string[] = [];
  const cursor = new Date(range.from);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= range.to && days.length < 400) {
    days.push(dayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/**
 * Computes the full analytics payload for a store from live data:
 * orders, customers, visits (AnalyticsEvent type=storefront.visit).
 * Zero data produces honest zeros — never invented numbers.
 */
export async function computeAnalytics(storeId: string, range: DateRange) {
  const [orders, allCustomerOrderCounts, visits] = await Promise.all([
    db.order.findMany({
      where: { storeId, createdAt: { gte: range.from, lte: range.to } },
      include: { items: true },
    }),
    db.order.groupBy({
      by: ["customerRefId"],
      where: { storeId, customerRefId: { not: null }, paidAt: { not: null } },
      _count: { _all: true },
    }),
    db.analyticsEvent.findMany({
      where: {
        storeId,
        type: "storefront.visit",
        createdAt: { gte: range.from, lte: range.to },
      },
      select: { payload: true, createdAt: true },
    }),
  ]);

  const paidOrders = orders.filter((o) =>
    (REVENUE_STATUSES as string[]).includes(o.status) || o.status === "REFUNDED"
  );
  const revenueCents = paidOrders.reduce(
    (s, o) => s + o.totalCents - o.refundedCents,
    0
  );

  // Per-day series.
  const days = daySeries(range);
  const byDay = new Map(days.map((d) => [d, { revenueCents: 0, orders: 0, visitors: 0 }]));
  for (const o of orders) {
    const k = dayKey(o.createdAt);
    const bucket = byDay.get(k);
    if (!bucket) continue;
    bucket.orders += 1;
    if (o.paidAt) bucket.revenueCents += o.totalCents - o.refundedCents;
  }
  for (const v of visits) {
    const bucket = byDay.get(dayKey(v.createdAt));
    if (bucket) bucket.visitors += 1;
  }

  // Top products by units + revenue.
  const productAgg = new Map<string, { name: string; units: number; revenueCents: number }>();
  for (const o of paidOrders) {
    for (const item of o.items) {
      const entry = productAgg.get(item.productId) ?? {
        name: item.productName,
        units: 0,
        revenueCents: 0,
      };
      entry.units += item.quantity;
      entry.revenueCents += item.unitPriceCents * item.quantity;
      productAgg.set(item.productId, entry);
    }
  }
  const topProducts = [...productAgg.entries()]
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 10);

  // Visit dimensions (populated once the Phase 4 storefront emits events).
  const sources = new Map<string, number>();
  const devices = new Map<string, number>();
  const countries = new Map<string, number>();
  const pages = new Map<string, number>();
  for (const v of visits) {
    try {
      const p = v.payload ? (JSON.parse(v.payload) as Record<string, string>) : {};
      sources.set(p.source ?? "direct", (sources.get(p.source ?? "direct") ?? 0) + 1);
      devices.set(p.device ?? "unknown", (devices.get(p.device ?? "unknown") ?? 0) + 1);
      countries.set(p.country ?? "unknown", (countries.get(p.country ?? "unknown") ?? 0) + 1);
      pages.set(p.path ?? "/", (pages.get(p.path ?? "/") ?? 0) + 1);
    } catch {
      // ignore malformed visit payloads
    }
  }
  const toSorted = (m: Map<string, number>) =>
    [...m.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count).slice(0, 10);

  const returningCustomers = allCustomerOrderCounts.filter((c) => c._count._all > 1).length;
  const visitors = visits.length;
  const conversionRate = visitors > 0 ? (paidOrders.length / visitors) * 100 : null;

  const unitsSold = paidOrders.reduce(
    (s, o) => s + o.items.reduce((x, i) => x + i.quantity, 0),
    0
  );

  return {
    range: { from: range.from.toISOString(), to: range.to.toISOString() },
    totals: {
      revenueCents,
      orders: orders.length,
      paidOrders: paidOrders.length,
      unitsSold,
      visitors,
      conversionRate, // null when there are no visits to measure against
      averageOrderCents: paidOrders.length
        ? Math.round(revenueCents / paidOrders.length)
        : 0,
      returningCustomers,
    },
    series: days.map((d) => ({ date: d, ...byDay.get(d)! })),
    topProducts,
    sources: toSorted(sources),
    devices: toSorted(devices),
    countries: toSorted(countries),
    topPages: toSorted(pages),
    funnel: {
      visitors,
      orders: orders.length,
      paid: paidOrders.length,
    },
  };
}

/** Headline metrics for the seller dashboard home. */
export async function computeHomeMetrics(storeId: string) {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const paidWhere = { storeId, paidAt: { not: null } } as const;

  const [
    revenueAgg,
    todayAgg,
    weekAgg,
    monthAgg,
    orderCount,
    customerCount,
    productCount,
    publishedCount,
    returningAgg,
    visitors,
  ] = await Promise.all([
    db.order.aggregate({
      where: paidWhere,
      _sum: { totalCents: true, refundedCents: true },
    }),
    db.order.aggregate({
      where: { ...paidWhere, paidAt: { gte: startOfDay } },
      _sum: { totalCents: true, refundedCents: true },
      _count: { _all: true },
    }),
    db.order.aggregate({
      where: { ...paidWhere, paidAt: { gte: startOfWeek } },
      _sum: { totalCents: true, refundedCents: true },
      _count: { _all: true },
    }),
    db.order.aggregate({
      where: { ...paidWhere, paidAt: { gte: startOfMonth } },
      _sum: { totalCents: true, refundedCents: true },
      _count: { _all: true },
    }),
    db.order.count({ where: { storeId } }),
    db.customer.count({ where: { storeId } }),
    db.product.count({ where: { storeId } }),
    db.product.count({ where: { storeId, status: "PUBLISHED" } }),
    db.order.groupBy({
      by: ["customerRefId"],
      where: { storeId, customerRefId: { not: null }, paidAt: { not: null } },
      _count: { _all: true },
    }),
    db.analyticsEvent.count({ where: { storeId, type: "storefront.visit" } }),
  ]);

  const paidOrders = returningAgg.reduce((s, c) => s + c._count._all, 0);
  const sum = (agg: { _sum: { totalCents: number | null; refundedCents: number | null } }) =>
    (agg._sum.totalCents ?? 0) - (agg._sum.refundedCents ?? 0);

  return {
    revenueCents: sum(revenueAgg),
    salesToday: { cents: sum(todayAgg), count: todayAgg._count._all },
    salesWeek: { cents: sum(weekAgg), count: weekAgg._count._all },
    salesMonth: { cents: sum(monthAgg), count: monthAgg._count._all },
    orders: orderCount,
    customers: customerCount,
    products: productCount,
    publishedProducts: publishedCount,
    returningCustomers: returningAgg.filter((c) => c._count._all > 1).length,
    conversionRate: visitors > 0 ? (paidOrders / visitors) * 100 : null,
    visitors,
  };
}
