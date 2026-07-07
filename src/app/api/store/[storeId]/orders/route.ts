import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { requireStoreAccess, notifyStoreOwner } from "@/lib/seller/access";
import { createOrderSchema } from "@/lib/validation/seller";
import { getPagination, pageMeta } from "@/lib/seller/pagination";
import { trackEvent } from "@/lib/analytics";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "orders");

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const status = sp.get("status");
  const { page, take, skip } = getPagination(req);

  const where: Prisma.OrderWhereInput = {
    storeId,
    ...(status && { status }),
    ...(q && {
      OR: [
        { customerEmail: { contains: q } },
        { trackingNumber: { contains: q } },
        ...(Number.isFinite(parseInt(q, 10)) ? [{ orderNumber: parseInt(q, 10) }] : []),
      ],
    }),
  };

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        customerRef: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  return ok({ orders, ...pageMeta(total, page) });
});

/**
 * Creates a manual/draft order (like Shopify draft orders): the seller picks
 * products, the system snapshots prices, computes totals with store tax, and
 * optionally marks the order paid — decrementing tracked inventory.
 */
export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { store, user } = await requireStoreAccess(storeId, "orders");
  const data = await parseBody(req, createOrderSchema);

  // Load and validate every referenced product/variant.
  const productIds = [...new Set(data.items.map((i) => i.productId))];
  const products = await db.product.findMany({
    where: { id: { in: productIds }, storeId },
    include: { variants: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const lineItems: {
    productId: string;
    variantId: string | null;
    productName: string;
    variantName: string | null;
    quantity: number;
    unitPriceCents: number;
  }[] = [];

  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product) return fail(`Product ${item.productId} not found in this store`, 400);

    let unitPrice = product.priceCents;
    let variantName: string | null = null;
    if (item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) return fail(`Variant not found on ${product.name}`, 400);
      unitPrice = variant.priceCents ?? product.priceCents;
      variantName = variant.name;
    }

    lineItems.push({
      productId: product.id,
      variantId: item.variantId ?? null,
      productName: product.name,
      variantName,
      quantity: item.quantity,
      unitPriceCents: unitPrice,
    });
  }

  const subtotalCents = lineItems.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  const discountCents = Math.min(data.discountCents ?? 0, subtotalCents);
  const shippingCents = data.shippingCents ?? 0;
  const taxableCents = subtotalCents - discountCents;
  const taxCents = store.taxInclusive
    ? 0
    : Math.round((taxableCents * store.taxRate) / 100);
  const totalCents = taxableCents + shippingCents + taxCents;

  const order = await db.$transaction(async (tx) => {
    // Upsert the CRM customer record.
    const customer = await tx.customer.upsert({
      where: { storeId_email: { storeId, email: data.customerEmail } },
      create: { storeId, email: data.customerEmail, name: data.customerName },
      update: { name: data.customerName },
    });

    const last = await tx.order.findFirst({
      where: { storeId },
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });
    const orderNumber = (last?.orderNumber ?? 1000) + 1;

    const created = await tx.order.create({
      data: {
        storeId,
        orderNumber,
        customerRefId: customer.id,
        customerEmail: data.customerEmail,
        status: data.markPaid ? "PAID" : "PENDING",
        subtotalCents,
        discountCents,
        shippingCents,
        taxCents,
        totalCents,
        currency: store.currency,
        customerNote: data.customerNote ?? null,
        paidAt: data.markPaid ? new Date() : null,
        items: { create: lineItems },
        timeline: {
          create: [
            {
              type: "CREATED",
              message: `Order created manually by ${user.name}`,
            },
            ...(data.markPaid
              ? [{ type: "PAYMENT", message: "Marked as paid (manual payment)" }]
              : []),
          ],
        },
      },
    });

    if (data.markPaid) {
      await tx.payment.create({
        data: {
          orderId: created.id,
          provider: "manual",
          status: "SUCCEEDED",
          amountCents: totalCents,
          currency: store.currency,
        },
      });

      // Decrement tracked inventory and write adjustment history.
      for (const li of lineItems) {
        const product = productMap.get(li.productId)!;
        if (!product.trackInventory) continue;

        if (li.variantId) {
          const updated = await tx.productVariant.update({
            where: { id: li.variantId },
            data: { stock: { decrement: li.quantity } },
          });
          await tx.inventoryAdjustment.create({
            data: {
              storeId,
              productId: li.productId,
              variantId: li.variantId,
              delta: -li.quantity,
              reason: "SALE",
              note: `Order #${orderNumber}`,
              stockAfter: updated.stock,
              actorName: user.name,
            },
          });
        } else {
          const updated = await tx.product.update({
            where: { id: li.productId },
            data: { stock: { decrement: li.quantity } },
          });
          await tx.inventoryAdjustment.create({
            data: {
              storeId,
              productId: li.productId,
              delta: -li.quantity,
              reason: "SALE",
              note: `Order #${orderNumber}`,
              stockAfter: updated.stock,
              actorName: user.name,
            },
          });
          if (updated.stock <= updated.lowStockThreshold) {
            await tx.notification.create({
              data: {
                userId: store.ownerId,
                type: "INVENTORY",
                title: `Low stock: ${product.name}`,
                body: `${updated.stock} left (threshold ${updated.lowStockThreshold}).`,
                href: `/store/${storeId}/inventory`,
              },
            });
          }
        }
      }
    }

    return created;
  });

  await trackEvent("order.created", {
    userId: user.id,
    storeId,
    payload: { orderId: order.id, totalCents, markPaid: Boolean(data.markPaid) },
  });
  await notifyStoreOwner(
    store,
    {
      type: "ORDER",
      title: `New order #${order.orderNumber}`,
      body: `${data.customerName} — total ${(totalCents / 100).toFixed(2)} ${store.currency}`,
      href: `/store/${storeId}/orders/${order.id}`,
    },
    user.id
  );

  return ok({ order }, { status: 201 });
});
