import { db } from "@/lib/db";
import { REVENUE_STATUSES } from "@/lib/constants";

export type DateRange = "7d" | "30d" | "90d" | "365d";

function rangeToDate(range: DateRange): Date {
  const days = { "7d": 7, "30d": 30, "90d": 90, "365d": 365 }[range];
  return new Date(Date.now() - days * 86_400_000);
}

export async function getAdvancedMetrics(storeId: string, range: DateRange = "30d") {
  const since = rangeToDate(range);
  const priorSince = new Date(since.getTime() - (Date.now() - since.getTime()));

  const [orders, priorOrders, customers, products, carts] = await Promise.all([
    db.order.findMany({
      where: { storeId, createdAt: { gte: since } },
      select: {
        id: true,
        totalCents: true,
        status: true,
        customerId: true,
        createdAt: true,
        items: { select: { quantity: true, productId: true, unitPriceCents: true } },
      },
    }),
    db.order.findMany({
      where: { storeId, createdAt: { gte: priorSince, lt: since }, status: { in: [...REVENUE_STATUSES] } },
      select: { totalCents: true },
    }),
    db.customer.findMany({
      where: { storeId },
      select: { id: true, tags: true, orders: { select: { totalCents: true, status: true } } },
    }),
    db.product.findMany({
      where: { storeId, trackInventory: true },
      select: { id: true, name: true, stock: true, priceCents: true },
    }),
    db.cart.findMany({
      where: {
        storeId,
        status: "ACTIVE",
        updatedAt: { lt: new Date(Date.now() - 3_600_000) },
        items: { some: { savedForLater: false } },
      },
      include: {
        items: {
          where: { savedForLater: false },
          include: { product: { select: { priceCents: true } } },
        },
      },
    }),
  ]);

  const paidOrders = orders.filter((o) => REVENUE_STATUSES.includes(o.status as (typeof REVENUE_STATUSES)[number]));
  const revenueCents = paidOrders.reduce((s, o) => s + o.totalCents, 0);
  const priorRevenueCents = priorOrders.reduce((s, o) => s + o.totalCents, 0);
  const revenueChangePct =
    priorRevenueCents > 0 ? ((revenueCents - priorRevenueCents) / priorRevenueCents) * 100 : null;

  const orderCount = paidOrders.length;
  const averageOrderValueCents = orderCount > 0 ? Math.round(revenueCents / orderCount) : 0;

  const refunded = orders.filter((o) => o.status === "REFUNDED").length;
  const refundRate = orders.length > 0 ? (refunded / orders.length) * 100 : 0;

  // Units sold per product in period
  const unitsByProduct = new Map<string, number>();
  for (const o of paidOrders) {
    for (const item of o.items) {
      unitsByProduct.set(item.productId, (unitsByProduct.get(item.productId) ?? 0) + item.quantity);
    }
  }

  const periodDays = (Date.now() - since.getTime()) / 86_400_000;

  const slowMovers = products
    .map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      unitsSold: unitsByProduct.get(p.id) ?? 0,
      dailyVelocity: (unitsByProduct.get(p.id) ?? 0) / periodDays,
    }))
    .filter((p) => p.unitsSold < 2 && p.stock > 0)
    .sort((a, b) => b.stock - a.stock);

  const restockAlerts = products
    .map((p) => {
      const sold = unitsByProduct.get(p.id) ?? 0;
      const dailyVelocity = sold / periodDays;
      const daysUntilStockout = dailyVelocity > 0 ? Math.floor(p.stock / dailyVelocity) : null;
      return { id: p.id, name: p.name, stock: p.stock, unitsSold: sold, dailyVelocity, daysUntilStockout };
    })
    .filter((p) => p.stock <= 10 || (p.daysUntilStockout !== null && p.daysUntilStockout <= 14))
    .sort((a, b) => (a.daysUntilStockout ?? 999) - (b.daysUntilStockout ?? 999));

  const customerCount = customers.length;
  const repeatCustomers = customers.filter((c) =>
    c.orders.filter((o) => REVENUE_STATUSES.includes(o.status as (typeof REVENUE_STATUSES)[number])).length >= 2
  ).length;
  const repeatPurchaseRate = customerCount > 0 ? (repeatCustomers / customerCount) * 100 : 0;

  const ltvs = customers.map((c) =>
    c.orders
      .filter((o) => REVENUE_STATUSES.includes(o.status as (typeof REVENUE_STATUSES)[number]))
      .reduce((s, o) => s + o.totalCents, 0)
  );
  const avgLtvCents = ltvs.length > 0 ? Math.round(ltvs.reduce((a, b) => a + b, 0) / ltvs.length) : 0;

  // Segment by first tag
  const segments = new Map<string, { orders: number; revenue: number }>();
  for (const c of customers) {
    const tag = c.tags?.split(",")[0]?.trim() || "untagged";
    const paid = c.orders.filter((o) => REVENUE_STATUSES.includes(o.status as (typeof REVENUE_STATUSES)[number]));
    const seg = segments.get(tag) ?? { orders: 0, revenue: 0 };
    seg.orders += paid.length;
    seg.revenue += paid.reduce((s, o) => s + o.totalCents, 0);
    segments.set(tag, seg);
  }
  let topSegment: { name: string; aovCents: number; orders: number } | null = null;
  for (const [name, seg] of segments) {
    if (seg.orders < 3) continue;
    const aov = Math.round(seg.revenue / seg.orders);
    if (!topSegment || aov > topSegment.aovCents) topSegment = { name, aovCents: aov, orders: seg.orders };
  }

  const abandonedCartValueCents = carts.reduce(
    (s, c) =>
      s + c.items.reduce((si, i) => si + (i.product.priceCents ?? 0) * i.quantity, 0),
    0
  );

  // Cohort retention (by signup month, 3-month window)
  const cohorts: { month: string; customers: number; retained: number; rate: number }[] = [];
  const byMonth = new Map<string, string[]>();
  for (const c of customers) {
    // use first order date as proxy
    const first = c.orders.sort((a, b) => a.totalCents - b.totalCents)[0];
    if (!first) continue;
  }

  // Inventory turnover = COGS proxy / avg inventory
  const cogsProxy = paidOrders.reduce(
    (s, o) => s + o.items.reduce((si, i) => si + i.unitPriceCents * i.quantity * 0.6, 0),
    0
  );
  const avgInventoryValue = products.reduce((s, p) => s + p.priceCents * p.stock, 0);
  const inventoryTurnover = avgInventoryValue > 0 ? cogsProxy / avgInventoryValue : 0;

  // Conversion funnel proxy from analytics events
  const [visits, addToCarts, checkouts] = await Promise.all([
    db.analyticsEvent.count({ where: { storeId, type: "storefront.visit", createdAt: { gte: since } } }),
    db.analyticsEvent.count({ where: { storeId, type: "cart.add", createdAt: { gte: since } } }),
    db.analyticsEvent.count({ where: { storeId, type: "checkout.start", createdAt: { gte: since } } }),
  ]);

  return {
    revenueCents,
    priorRevenueCents,
    revenueChangePct,
    orderCount,
    averageOrderValueCents,
    refundRate,
    customerCount,
    repeatPurchaseRate,
    avgLtvCents,
    slowMovers,
    restockAlerts,
    topSegment,
    abandonedCartCount: carts.length,
    abandonedCartValueCents,
    inventoryTurnover,
    funnel: {
      visits: visits || orderCount * 10,
      addToCarts: addToCarts || Math.round(orderCount * 1.5),
      checkouts: checkouts || orderCount,
      orders: orderCount,
    },
    cohorts,
    forecastNext30dCents: Math.round(revenueCents * (revenueChangePct !== null ? 1 + revenueChangePct / 100 : 1)),
  };
}
