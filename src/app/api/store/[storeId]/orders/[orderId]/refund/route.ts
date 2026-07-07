import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { refundOrderSchema } from "@/lib/validation/seller";
import { formatMoney } from "@/lib/money";
import { trackEvent } from "@/lib/analytics";
import { getPaymentProvider } from "@/lib/payments";
import { auditLog } from "@/lib/audit";
import { onOrderEvent } from "@/lib/automation/dispatcher";
import { sendMail } from "@/lib/email/mailer";
import { refundEmail } from "@/lib/email/templates";

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId, orderId } = await params;
  const { store, user } = await requireStoreAccess(storeId, "orders");

  const order = await db.order.findFirst({
    where: { id: orderId, storeId },
    include: { items: { include: { product: true } } },
  });
  if (!order) return fail("Order not found", 404);
  if (!order.paidAt) return fail("Only paid orders can be refunded", 400);

  const { amountCents, reason, restock } = await parseBody(req, refundOrderSchema);

  const refundable = order.totalCents - order.refundedCents;
  if (amountCents > refundable) {
    return fail(
      `Maximum refundable amount is ${formatMoney(refundable, order.currency)}`,
      400,
      { amountCents: `Max ${formatMoney(refundable, order.currency)}` }
    );
  }

  const fullyRefunded = order.refundedCents + amountCents >= order.totalCents;

  // Refund through the original payment provider when the charge was
  // processed by a gateway (storefront orders); manual orders stay manual.
  const originalPayment = await db.payment.findFirst({
    where: { orderId, status: "SUCCEEDED", amountCents: { gt: 0 } },
    orderBy: { createdAt: "asc" },
  });
  let refundRef: string | null = null;
  let refundProvider = "manual";
  if (originalPayment && originalPayment.provider !== "manual" && originalPayment.providerRef) {
    const provider = getPaymentProvider();
    const result = await provider.refund(originalPayment.providerRef, amountCents);
    if (!result.ok) {
      return fail(`The payment provider rejected the refund: ${result.message}`, 502);
    }
    refundRef = result.providerRef;
    refundProvider = originalPayment.provider;
  }

  await db.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        orderId,
        provider: refundProvider,
        providerRef: refundRef,
        status: "REFUNDED",
        amountCents: -amountCents,
        currency: order.currency,
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: {
        refundedCents: { increment: amountCents },
        ...(fullyRefunded && { status: "REFUNDED" }),
        timeline: {
          create: {
            type: "REFUND",
            message: `${formatMoney(amountCents, order.currency)} refunded by ${user.name} — ${reason}`,
          },
        },
      },
    });

    if (restock) {
      for (const item of order.items) {
        if (!item.product.trackInventory) continue;
        if (item.variantId) {
          const v = await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
          await tx.inventoryAdjustment.create({
            data: {
              storeId,
              productId: item.productId,
              variantId: item.variantId,
              delta: item.quantity,
              reason: "RETURN",
              note: `Refund on order #${order.orderNumber}`,
              stockAfter: v.stock,
              actorName: user.name,
            },
          });
        } else {
          const p = await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
          await tx.inventoryAdjustment.create({
            data: {
              storeId,
              productId: item.productId,
              delta: item.quantity,
              reason: "RETURN",
              note: `Refund on order #${order.orderNumber}`,
              stockAfter: p.stock,
              actorName: user.name,
            },
          });
        }
      }
    }

    await tx.notification.create({
      data: {
        userId: store.ownerId,
        type: "PAYMENT",
        title: `Refund issued on order #${order.orderNumber}`,
        body: `${formatMoney(amountCents, order.currency)} — ${reason}`,
        href: `/store/${storeId}/orders/${orderId}`,
      },
    });
  });

  await trackEvent("order.refunded", {
    userId: user.id,
    storeId,
    payload: { orderId, amountCents, fullyRefunded },
  });
  await auditLog({
    action: "refund.issued",
    storeId,
    userId: user.id,
    detail: { orderId, amountCents, provider: refundProvider, fullyRefunded },
  });

  // Notify the buyer that their refund was processed.
  if (order.customerId) {
    await db.notification.create({
      data: {
        userId: order.customerId,
        type: "PAYMENT",
        title: `Refund processed — order #${order.orderNumber}`,
        body: `${formatMoney(amountCents, order.currency)} was refunded by ${store.name}.`,
        href: `/account/orders/${order.id}`,
      },
    });
  }
  const mail = refundEmail({
    store: { name: store.name },
    orderNumber: order.orderNumber,
    amountCents,
    currency: order.currency,
    reason,
  });
  await sendMail({
    to: order.customerEmail,
    subject: mail.subject,
    text: `${mail.text}\n\nDepending on your bank, the money can take a few business days to arrive.`,
    html: `${mail.html}<p style="margin-top:12px;font-size:12px;color:#7A7266;">Depending on your bank, the money can take a few business days to arrive.</p>`,
  });

  if (fullyRefunded) {
    await onOrderEvent(storeId, "REFUND_COMPLETED", {
      id: order.id,
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
      customerEmail: order.customerEmail,
    });
  }

  const updated = await db.order.findUnique({
    where: { id: orderId },
    include: { payments: true, timeline: { orderBy: { createdAt: "desc" } } },
  });
  return ok({ order: updated });
});
