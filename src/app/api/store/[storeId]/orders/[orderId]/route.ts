import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { updateOrderSchema } from "@/lib/validation/seller";
import { trackEvent } from "@/lib/analytics";
import { sendMail } from "@/lib/email/mailer";
import { shippingUpdateEmail } from "@/lib/email/templates";
import { onOrderEvent } from "@/lib/automation/dispatcher";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId, orderId } = await params;
  await requireStoreAccess(storeId, "orders");

  const order = await db.order.findFirst({
    where: { id: orderId, storeId },
    include: {
      items: { include: { product: { select: { slug: true } } } },
      payments: { orderBy: { createdAt: "desc" } },
      timeline: { orderBy: { createdAt: "desc" } },
      customerRef: true,
    },
  });
  if (!order) return fail("Order not found", 404);
  return ok({ order });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId, orderId } = await params;
  const { store, user } = await requireStoreAccess(storeId, "orders");

  const order = await db.order.findFirst({ where: { id: orderId, storeId } });
  if (!order) return fail("Order not found", 404);

  const data = await parseBody(req, updateOrderSchema);
  const events: { type: string; message: string; internal?: boolean }[] = [];

  if (data.status && data.status !== order.status) {
    if (order.status === "REFUNDED") {
      return fail("Refunded orders can't change status", 400);
    }
    events.push({
      type: "STATUS_CHANGE",
      message: `Status changed from ${order.status} to ${data.status} by ${user.name}`,
    });
  }
  if (data.trackingNumber !== undefined && data.trackingNumber !== order.trackingNumber) {
    events.push({
      type: "TRACKING",
      message: data.trackingNumber
        ? `Tracking number set to ${data.trackingNumber}${data.shippingCarrier ? ` (${data.shippingCarrier})` : ""}`
        : "Tracking number removed",
    });
  }
  if (data.internalNote !== undefined && data.internalNote !== order.internalNote) {
    events.push({ type: "NOTE", message: "Internal note updated", internal: true });
  }

  const becamePaid = data.status === "PAID" && order.status === "PENDING";

  const updated = await db.$transaction(async (tx) => {
    const result = await tx.order.update({
      where: { id: orderId },
      data: {
        ...data,
        ...(data.status === "PAID" && !order.paidAt && { paidAt: new Date() }),
        ...(data.status === "SHIPPED" && !order.shippedAt && { shippedAt: new Date() }),
        ...(data.status === "DELIVERED" && !order.deliveredAt && { deliveredAt: new Date() }),
        timeline: { create: events },
      },
    });

    if (becamePaid) {
      await tx.payment.create({
        data: {
          orderId,
          provider: "manual",
          status: "SUCCEEDED",
          amountCents: order.totalCents,
          currency: order.currency,
        },
      });
      await tx.notification.create({
        data: {
          userId: store.ownerId,
          type: "PAYMENT",
          title: `Payment received for order #${order.orderNumber}`,
          body: `${(order.totalCents / 100).toFixed(2)} ${order.currency}`,
          href: `/store/${storeId}/orders/${orderId}`,
        },
      });
    }

    return result;
  });

  if (data.status) {
    await trackEvent("order.status_changed", {
      userId: user.id,
      storeId,
      payload: { orderId, from: order.status, to: data.status },
    });

    // Keep the buyer in the loop on fulfillment progress.
    if (order.customerId && data.status !== order.status) {
      const buyerMessages: Record<string, string> = {
        PROCESSING: "is being prepared",
        PACKED: "has been packed",
        SHIPPED: order.trackingNumber || data.trackingNumber
          ? `has shipped — tracking ${data.trackingNumber ?? order.trackingNumber}`
          : "has shipped",
        DELIVERED: "was delivered",
        CANCELLED: "was cancelled",
      };
      const message = buyerMessages[data.status];
      if (message) {
        await db.notification.create({
          data: {
            userId: order.customerId,
            type: "ORDER",
            title: `Order #${order.orderNumber} ${message.split(" — ")[0]}`,
            body: `Your ${store.name} order ${message}.`,
            href: `/account/orders/${order.id}`,
          },
        });
      }
    }

    // Shipping and delivery updates also go out by email (guests included).
    if (["SHIPPED", "DELIVERED"].includes(data.status) && data.status !== order.status) {
      const tracking = data.trackingNumber ?? order.trackingNumber;
      const carrier = data.shippingCarrier ?? order.shippingCarrier;
      const mail = shippingUpdateEmail({
        store: { name: store.name },
        orderNumber: order.orderNumber,
        status: data.status as "SHIPPED" | "DELIVERED",
        tracking,
        carrier,
      });
      await sendMail({
        to: order.customerEmail,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
    }
  }

  if (data.status === "SHIPPED" && order.status !== "SHIPPED") {
    await onOrderEvent(storeId, "ORDER_SHIPPED", {
      id: order.id,
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
      customerEmail: order.customerEmail,
    });
  }

  return ok({ order: updated });
});
