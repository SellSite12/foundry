import { db } from "@/lib/db";
import { sendMail } from "@/lib/email/mailer";
import { createNotification } from "@/lib/notifications";
import { formatMoney } from "@/lib/money";

const ABANDONED_AFTER_MS = 60 * 60 * 1000; // 1 hour without cart activity

type RunResult = { processed: number; notified: number; skipped: number };

/**
 * Finds ACTIVE carts that have been idle past the threshold and fires
 * enabled CART_ABANDONED automation rules for each store.
 */
export async function runAbandonedCartAutomations(
  storeId?: string
): Promise<RunResult> {
  const cutoff = new Date(Date.now() - ABANDONED_AFTER_MS);
  const result: RunResult = { processed: 0, notified: 0, skipped: 0 };

  const rules = await db.automationRule.findMany({
    where: {
      trigger: "CART_ABANDONED",
      enabled: true,
      ...(storeId ? { storeId } : {}),
    },
    include: { store: { select: { id: true, name: true, slug: true, ownerId: true } } },
  });
  if (rules.length === 0) return result;

  const storeIds = [...new Set(rules.map((r) => r.storeId))];
  const abandoned = await db.cart.findMany({
    where: {
      storeId: { in: storeIds },
      status: "ACTIVE",
      updatedAt: { lt: cutoff },
      items: { some: { savedForLater: false } },
    },
    include: {
      items: {
        where: { savedForLater: false },
        include: { product: { select: { name: true, priceCents: true } } },
      },
      user: { select: { id: true, email: true, name: true } },
    },
  });

  for (const cart of abandoned) {
    result.processed++;
    const rule = rules.find((r) => r.storeId === cart.storeId);
    if (!rule) {
      result.skipped++;
      continue;
    }

    // Skip if we already notified for this cart (config stores last cart id).
    let config: { lastCartId?: string; lastNotifiedAt?: string } = {};
    try {
      config = rule.config ? (JSON.parse(rule.config) as typeof config) : {};
    } catch {
      config = {};
    }
    if (config.lastCartId === cart.id) {
      result.skipped++;
      continue;
    }

    const subtotal = cart.items.reduce(
      (s, i) => s + (i.product.priceCents ?? 0) * i.quantity,
      0
    );
    const itemSummary = cart.items
      .map((i) => `${i.quantity}× ${i.product.name}`)
      .join(", ");
    const shopUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/shop/${rule.store.slug}/cart`;
    const buyerEmail = cart.user?.email;

    if (rule.action === "SEND_EMAIL" && buyerEmail) {
      await sendMail({
        to: buyerEmail,
        subject: `You left items in your ${rule.store.name} cart`,
        text: `Hi ${cart.user?.name ?? "there"},\n\nYou still have items waiting:\n${itemSummary}\n\nSubtotal: ${formatMoney(subtotal, "USD")}\n\nComplete your order: ${shopUrl}\n`,
        html: `<p>You still have items in your <strong>${rule.store.name}</strong> cart:</p><p>${itemSummary}</p><p><a href="${shopUrl}">Return to cart</a></p>`,
      });
    }

    if (rule.action === "NOTIFY" || rule.action === "SEND_EMAIL") {
      await createNotification({
        userId: rule.store.ownerId,
        type: "CUSTOMER",
        title: `Abandoned cart — ${itemSummary.slice(0, 60)}${itemSummary.length > 60 ? "…" : ""}`,
        body: `${formatMoney(subtotal, "USD")} subtotal · ${buyerEmail ?? "guest shopper"}`,
        href: `/store/${rule.store.id}/customers`,
      });
    }

    await db.automationRule.update({
      where: { id: rule.id },
      data: {
        runCount: { increment: 1 },
        config: JSON.stringify({ ...config, lastCartId: cart.id, lastNotifiedAt: new Date().toISOString() }),
      },
    });

    result.notified++;
  }

  return result;
}
