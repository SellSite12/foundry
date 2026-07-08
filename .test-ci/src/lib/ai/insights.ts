import { db } from "@/lib/db";
import { REVENUE_STATUSES } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { getAdvancedMetrics } from "@/lib/seller/advanced-metrics";
import { answerStoreQuestion } from "@/lib/ai/assistant";

export async function refreshStoreInsights(storeId: string): Promise<number> {
  const metrics = await getAdvancedMetrics(storeId, "30d");
  const insights: {
    kind: string;
    title: string;
    body: string;
    explanation: string;
    dataJson: string;
    priority: string;
  }[] = [];

  // Revenue trend
  if (metrics.revenueChangePct !== null) {
    const dir = metrics.revenueChangePct >= 0 ? "up" : "down";
    insights.push({
      kind: "revenue_trend",
      title: `Revenue is ${dir} ${Math.abs(metrics.revenueChangePct).toFixed(1)}% vs prior period`,
      body: `Current period revenue is ${formatMoney(metrics.revenueCents, "USD")} across ${metrics.orderCount} orders.`,
      explanation: `Compared trailing 30-day paid revenue (${formatMoney(metrics.revenueCents, "USD")}) to the previous 30-day window (${formatMoney(metrics.priorRevenueCents, "USD")}).`,
      dataJson: JSON.stringify({ revenueChangePct: metrics.revenueChangePct, orderCount: metrics.orderCount }),
      priority: Math.abs(metrics.revenueChangePct) > 15 ? "HIGH" : "NORMAL",
    });
  }

  // Slow movers
  for (const p of metrics.slowMovers.slice(0, 3)) {
    insights.push({
      kind: "slow_mover",
      title: `Slow mover: ${p.name}`,
      body: `${p.unitsSold} units sold in 30 days with ${p.stock} units on hand.`,
      explanation: `Sold fewer than 2 units in 30 days while holding ${p.stock} units — capital tied up in low-velocity inventory.`,
      dataJson: JSON.stringify(p),
      priority: p.stock > 20 ? "HIGH" : "NORMAL",
    });
  }

  // Restock alerts
  for (const p of metrics.restockAlerts.slice(0, 3)) {
    const days = p.daysUntilStockout ?? null;
    insights.push({
      kind: "restock",
      title: `Restock soon: ${p.name}`,
      body: days
        ? `Estimated stock-out in ${days} days at current sell-through.`
        : `Only ${p.stock} units remain.`,
      explanation: `Based on ${p.unitsSold} units sold in 30 days (${(p.dailyVelocity).toFixed(2)}/day velocity) and ${p.stock} units on hand.`,
      dataJson: JSON.stringify(p),
      priority: (days ?? 99) <= 7 ? "HIGH" : "NORMAL",
    });
  }

  // Retention
  if (metrics.repeatPurchaseRate < 20 && metrics.customerCount > 5) {
    insights.push({
      kind: "retention",
      title: "Repeat purchase rate is below benchmark",
      body: `${metrics.repeatPurchaseRate.toFixed(1)}% of customers ordered more than once.`,
      explanation: `Calculated from customers with 2+ paid orders divided by total customers (${metrics.customerCount}). Industry median is often 20–30% for DTC.`,
      dataJson: JSON.stringify({ repeatPurchaseRate: metrics.repeatPurchaseRate }),
      priority: "NORMAL",
    });
  }

  // High-risk abandoned carts
  if (metrics.abandonedCartValueCents > 0) {
    insights.push({
      kind: "cart_risk",
      title: `${formatMoney(metrics.abandonedCartValueCents, "USD")} in abandoned carts`,
      body: `${metrics.abandonedCartCount} carts idle over 1 hour with items.`,
      explanation: `Summed line-item value of ACTIVE carts not updated in the last hour.`,
      dataJson: JSON.stringify({
        abandonedCartValueCents: metrics.abandonedCartValueCents,
        abandonedCartCount: metrics.abandonedCartCount,
      }),
      priority: metrics.abandonedCartValueCents > 50000 ? "HIGH" : "NORMAL",
    });
  }

  // Marketing opportunity — high AOV segment
  if (metrics.averageOrderValueCents > 0 && metrics.topSegment) {
    insights.push({
      kind: "marketing",
      title: `Target ${metrics.topSegment.name} customers`,
      body: `This segment averages ${formatMoney(metrics.topSegment.aovCents, "USD")} per order.`,
      explanation: `Grouped customers by tag "${metrics.topSegment.name}" with highest average order value among segments with 3+ orders.`,
      dataJson: JSON.stringify(metrics.topSegment),
      priority: "NORMAL",
    });
  }

  // Clear stale NEW insights older than 7 days
  await db.aiInsight.deleteMany({
    where: {
      storeId,
      status: "NEW",
      createdAt: { lt: new Date(Date.now() - 7 * 86_400_000) },
    },
  });

  let created = 0;
  for (const ins of insights) {
    const exists = await db.aiInsight.findFirst({
      where: { storeId, kind: ins.kind, title: ins.title, status: "NEW" },
    });
    if (exists) continue;
    await db.aiInsight.create({ data: { storeId, ...ins } });
    created++;
  }
  return created;
}

export async function chatWithAssistant(input: {
  storeId: string;
  userId: string;
  threadId?: string;
  message: string;
}) {
  let threadId = input.threadId;
  if (!threadId) {
    const thread = await db.aiThread.create({
      data: {
        storeId: input.storeId,
        userId: input.userId,
        title: input.message.slice(0, 60),
      },
    });
    threadId = thread.id;
  }

  await db.aiMessage.create({
    data: { threadId, role: "user", content: input.message },
  });

  const { reply, data } = await answerStoreQuestion(input.storeId, input.message);

  const assistantMsg = await db.aiMessage.create({
    data: {
      threadId,
      role: "assistant",
      content: reply,
      dataJson: data ? JSON.stringify(data) : null,
    },
  });

  await db.aiThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });

  return { threadId, message: assistantMsg };
}

/** Quick performance summary for dashboards */
export async function getStorePerformanceSummary(storeId: string) {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const orders = await db.order.findMany({
    where: { storeId, status: { in: [...REVENUE_STATUSES] }, createdAt: { gte: since } },
    select: { totalCents: true },
  });
  const revenue = orders.reduce((s, o) => s + o.totalCents, 0);
  return { revenueCents: revenue, orderCount: orders.length, periodDays: 30 };
}
