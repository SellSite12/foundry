import { db } from "@/lib/db";
import { sendMail } from "@/lib/email/mailer";
import { createNotification } from "@/lib/notifications";
import { enqueueJob } from "@/lib/jobs/queue";
import { emitWebhookEvent } from "@/lib/webhooks/delivery";
import { generateContent } from "@/lib/ai/generate";
import { formatMoney } from "@/lib/money";

type AutomationConfig = {
  delayMinutes?: number;
  conditions?: { field: string; op: string; value: string }[];
  emailSubject?: string;
  emailBody?: string;
  webhookUrl?: string;
  tag?: string;
  discountPercent?: number;
  taskTitle?: string;
  aiKind?: string;
  aiPrompt?: string;
};

function parseConfig(raw: string | null): AutomationConfig {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AutomationConfig;
  } catch {
    return {};
  }
}

function evalConditions(
  conditions: AutomationConfig["conditions"],
  context: Record<string, unknown>
): boolean {
  if (!conditions?.length) return true;
  return conditions.every((c) => {
    const val = context[c.field];
    const target = c.value;
    switch (c.op) {
      case "eq":
        return String(val) === target;
      case "gt":
        return Number(val) > Number(target);
      case "lt":
        return Number(val) < Number(target);
      case "contains":
        return String(val).toLowerCase().includes(target.toLowerCase());
      default:
        return true;
    }
  });
}

async function runAction(
  rule: {
    id: string;
    storeId: string;
    action: string;
    config: string | null;
    store: { id: string; name: string; slug: string; ownerId: string };
  },
  context: Record<string, unknown>
): Promise<void> {
  const config = parseConfig(rule.config);

  if (config.delayMinutes && config.delayMinutes > 0) {
    await enqueueJob({
      type: "automation.run",
      storeId: rule.storeId,
      scheduledAt: new Date(Date.now() + config.delayMinutes * 60_000),
      payload: {
        trigger: "__delayed__",
        storeId: rule.storeId,
        context: { ...context, ruleId: rule.id, skipDelay: true },
      },
    });
    return;
  }

  if (!evalConditions(config.conditions, context)) return;

  switch (rule.action) {
    case "NOTIFY":
      await createNotification({
        userId: rule.store.ownerId,
        type: "INFO",
        title: String(context.title ?? `Automation: ${rule.action}`),
        body: String(context.body ?? ""),
        href: context.href ? String(context.href) : `/store/${rule.storeId}/automation`,
      });
      break;

    case "SEND_EMAIL": {
      const to = String(context.email ?? context.buyerEmail ?? "");
      if (!to) break;
      await sendMail({
        to,
        subject: config.emailSubject ?? `Update from ${rule.store.name}`,
        text: config.emailBody ?? String(context.body ?? ""),
        html: `<p>${(config.emailBody ?? String(context.body ?? "")).replace(/\n/g, "<br>")}</p>`,
      });
      break;
    }

    case "TAG_CUSTOMER": {
      const customerId = String(context.customerId ?? "");
      const tag = config.tag ?? String(context.tag ?? "");
      if (!customerId || !tag) break;
      const customer = await db.customer.findFirst({ where: { id: customerId, storeId: rule.storeId } });
      if (!customer) break;
      const tags = customer.tags ? customer.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
      if (!tags.includes(tag)) tags.push(tag);
      await db.customer.update({ where: { id: customerId }, data: { tags: tags.join(", ") } });
      break;
    }

    case "WEBHOOK":
      await emitWebhookEvent(rule.storeId, String(context.event ?? "automation.fired"), {
        ruleId: rule.id,
        ...context,
      });
      break;

    case "CREATE_DISCOUNT": {
      const pct = config.discountPercent ?? 10;
      const code = `AUTO${Date.now().toString(36).toUpperCase()}`;
      await db.discount.create({
        data: {
          storeId: rule.storeId,
          title: `Automation ${code}`,
          code,
          kind: "CODE",
          type: "PERCENT",
          value: pct,
          status: "ACTIVE",
        },
      });
      break;
    }

    case "CREATE_TASK":
      await createNotification({
        userId: rule.store.ownerId,
        type: "TEAM",
        title: config.taskTitle ?? "Automation task",
        body: String(context.body ?? "Review and complete this task."),
        href: `/store/${rule.storeId}/inbox`,
      });
      break;

    case "UPDATE_DATABASE":
      if (context.productId && context.newStock !== undefined) {
        await db.product.update({
          where: { id: String(context.productId) },
          data: { stock: Number(context.newStock) },
        });
      }
      break;

    case "GENERATE_AI": {
      const userId = rule.store.ownerId;
      const content = await generateContent({
        kind: config.aiKind ?? "email",
        storeId: rule.storeId,
        prompt: config.aiPrompt ?? String(context.prompt ?? ""),
        context,
      });
      await db.aiDraft.create({
        data: {
          storeId: rule.storeId,
          userId,
          kind: config.aiKind ?? "email",
          content,
          prompt: config.aiPrompt,
          status: "PENDING",
        },
      });
      break;
    }

    case "BRANCH":
      // Conditions already evaluated; no-op marker action
      break;
  }

  await db.automationRule.update({
    where: { id: rule.id },
    data: { runCount: { increment: 1 } },
  });
}

/**
 * Dispatch all enabled automation rules for a trigger event.
 */
export async function dispatchAutomation(
  trigger: string,
  storeId: string,
  context: Record<string, unknown> = {}
): Promise<number> {
  if (trigger === "__delayed__" && context.ruleId) {
    const rule = await db.automationRule.findUnique({
      where: { id: String(context.ruleId) },
      include: { store: { select: { id: true, name: true, slug: true, ownerId: true } } },
    });
    if (rule?.enabled) {
      await runAction(rule, context);
      return 1;
    }
    return 0;
  }

  const rules = await db.automationRule.findMany({
    where: { storeId, trigger, enabled: true },
    include: { store: { select: { id: true, name: true, slug: true, ownerId: true } } },
  });

  for (const rule of rules) {
    await runAction(rule, context);
  }
  return rules.length;
}

/** Convenience: fire automation + webhook for order events. */
export async function onOrderEvent(
  storeId: string,
  event: "ORDER_CREATED" | "ORDER_SHIPPED" | "REFUND_COMPLETED",
  order: { id: string; orderNumber: string | number; totalCents: number; customerEmail?: string | null }
) {
  const orderNum = String(order.orderNumber);
  const context = {
    orderId: order.id,
    orderNumber: orderNum,
    total: formatMoney(order.totalCents, "USD"),
    totalCents: order.totalCents,
    email: order.customerEmail,
    event: event.toLowerCase().replace(/_/g, "."),
    title: `Order ${orderNum}`,
    body: `Total ${formatMoney(order.totalCents, "USD")}`,
    href: `/store/${storeId}/orders/${order.id}`,
  };

  await dispatchAutomation(event, storeId, context);

  const webhookEvent =
    event === "ORDER_CREATED"
      ? "order.created"
      : event === "ORDER_SHIPPED"
        ? "order.shipped"
        : "order.refunded";
  await emitWebhookEvent(storeId, webhookEvent, context);
}
