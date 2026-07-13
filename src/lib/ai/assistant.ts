import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getAdvancedMetrics } from "@/lib/seller/advanced-metrics";
import { callLlm } from "@/lib/ai/provider";

const INTENT_PATTERNS: { pattern: RegExp; handler: string }[] = [
  { pattern: /revenue|sales|performance|earning/i, handler: "revenue" },
  { pattern: /trend|change|growth|decline/i, handler: "trends" },
  { pattern: /inventory|stock|restock|slow/i, handler: "inventory" },
  { pattern: /customer|retention|repeat|ltv|lifetime/i, handler: "customers" },
  { pattern: /cart|abandon/i, handler: "carts" },
  { pattern: /price|pricing|discount|promo/i, handler: "pricing" },
  { pattern: /email|marketing|campaign/i, handler: "marketing" },
  { pattern: /support|reply|inquiry/i, handler: "support" },
  { pattern: /describe|description|seo|social/i, handler: "content" },
];

export async function answerStoreQuestion(
  storeId: string,
  question: string
): Promise<{ reply: string; data?: Record<string, unknown> }> {
  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { name: true },
  });
  if (!store) return { reply: "Store not found." };

  const metrics = await getAdvancedMetrics(storeId, "30d");
  const intent = INTENT_PATTERNS.find((p) => p.pattern.test(question))?.handler ?? "general";

  const data: Record<string, unknown> = {
    revenueCents: metrics.revenueCents,
    orderCount: metrics.orderCount,
    aov: metrics.averageOrderValueCents,
    repeatRate: metrics.repeatPurchaseRate,
    ltv: metrics.avgLtvCents,
  };

  let reply: string;

  switch (intent) {
    case "revenue":
      reply = `In the last 30 days, ${store.name} generated ${formatMoney(metrics.revenueCents, "USD")} from ${metrics.orderCount} orders (AOV ${formatMoney(metrics.averageOrderValueCents, "USD")}).`;
      if (metrics.revenueChangePct !== null) {
        reply += ` Revenue is ${metrics.revenueChangePct >= 0 ? "up" : "down"} ${Math.abs(metrics.revenueChangePct).toFixed(1)}% vs the prior period.`;
      }
      break;

    case "trends":
      reply =
        metrics.revenueChangePct !== null
          ? `Revenue trend: ${metrics.revenueChangePct >= 0 ? "+" : ""}${metrics.revenueChangePct.toFixed(1)}% period-over-period. Refund rate: ${metrics.refundRate.toFixed(1)}%.`
          : `Not enough historical orders yet to compute a trend. Current 30-day revenue: ${formatMoney(metrics.revenueCents, "USD")}.`;
      break;

    case "inventory": {
      const restock = metrics.restockAlerts.slice(0, 3).map((p) => p.name).join(", ");
      const slow = metrics.slowMovers.slice(0, 3).map((p) => p.name).join(", ");
      reply = restock
        ? `Restock priority: ${restock}.`
        : "No urgent restock alerts.";
      if (slow) reply += ` Slow movers to review: ${slow}.`;
      break;
    }

    case "customers":
      reply = `${metrics.customerCount} customers; ${metrics.repeatPurchaseRate.toFixed(1)}% repeat purchase rate; average LTV ${formatMoney(metrics.avgLtvCents, "USD")}.`;
      break;

    case "carts":
      reply = `${metrics.abandonedCartCount} abandoned carts worth ${formatMoney(metrics.abandonedCartValueCents, "USD")}. Consider a recovery email automation.`;
      break;

    case "pricing":
      reply = `Average order value is ${formatMoney(metrics.averageOrderValueCents, "USD")}. Review slow movers for markdowns and top sellers for bundle pricing.`;
      if (metrics.slowMovers[0]) {
        reply += ` "${metrics.slowMovers[0].name}" sold only ${metrics.slowMovers[0].unitsSold} units — a modest discount could accelerate sell-through.`;
      }
      break;

    case "marketing":
      reply = `Top segment: ${metrics.topSegment?.name ?? "untagged"} (AOV ${formatMoney(metrics.topSegment?.aovCents ?? metrics.averageOrderValueCents, "USD")}). Use AI drafts to generate email/social copy — all content requires your review before publishing.`;
      break;

    case "support":
      reply =
        "I can draft support replies from real order context. Create a draft from the AI Assistant or Inbox — drafts stay PENDING until you publish.";
      break;

    case "content":
      reply =
        "Use Generate in the assistant panel to create product descriptions, SEO fields, emails, or social posts. Drafts are saved for review before publishing.";
      break;

    default:
      reply = `${store.name} — last 30 days: ${formatMoney(metrics.revenueCents, "USD")} revenue, ${metrics.orderCount} orders. Ask about revenue, inventory, customers, carts, or content generation.`;
  }

  const llm = await callLlm(
    `You are a concise business assistant for ${store.name}. Ground answers in the metrics provided. Never invent numbers.`,
    `Metrics: ${JSON.stringify(data)}\nBase answer: ${reply}\nUser question: ${question}\nRefine the answer in 2-4 sentences.`
  );
  if (llm) reply = llm;

  return { reply, data };
}
