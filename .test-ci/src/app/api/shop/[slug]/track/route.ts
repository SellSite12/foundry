import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { getLiveStore } from "@/lib/shop/storefront";
import { trackOrderSchema } from "@/lib/validation/shop";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Guest order tracking: order number + the email used at checkout. Returns
 * only fulfillment-relevant fields — no payment or address data.
 */
export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  rateLimit(req, "track", 20, 60_000);
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) return fail("Store not found", 404);

  const data = await parseBody(req, trackOrderSchema);

  const order = await db.order.findFirst({
    where: {
      storeId: store.id,
      orderNumber: data.orderNumber,
      customerEmail: data.email.toLowerCase(),
    },
    include: {
      items: { select: { productName: true, variantName: true, quantity: true } },
      timeline: {
        where: { internal: false },
        orderBy: { createdAt: "asc" },
        select: { type: true, message: true, createdAt: true },
      },
    },
  });
  if (!order) return fail("No order found with that number and email.", 404);

  return ok({
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      trackingNumber: order.trackingNumber,
      shippingCarrier: order.shippingCarrier,
      shippingMethod: order.shippingMethod,
      totalCents: order.totalCents,
      currency: order.currency,
      items: order.items,
      timeline: order.timeline,
    },
  });
});
