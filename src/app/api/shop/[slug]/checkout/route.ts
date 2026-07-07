import { NextRequest } from "next/server";
import type { Store } from "@prisma/client";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { getLiveStore } from "@/lib/shop/storefront";
import { getActiveCart } from "@/lib/shop/cart";
import { computeQuote, CheckoutError, type Quote } from "@/lib/shop/checkout";
import { placeOrderSchema } from "@/lib/validation/shop";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getPaymentProvider,
  assessRisk,
  type ChargeMethod,
  type ChargeSuccess,
} from "@/lib/payments";
import { tokenizeCard } from "@/lib/payments/foundry-pay";
import { rateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { trackEvent } from "@/lib/analytics";
import { createNotification } from "@/lib/notifications";
import { sendMail } from "@/lib/email/mailer";
import { orderConfirmationEmail } from "@/lib/email/templates";
import { formatMoney } from "@/lib/money";
import { onOrderEvent } from "@/lib/automation/dispatcher";

type ActiveCart = NonNullable<Awaited<ReturnType<typeof getActiveCart>>>;

/**
 * Places an order: validates the cart, re-prices it server-side, charges
 * the payment provider, and records everything atomically.
 */
export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  rateLimit(req, "checkout", 15, 60_000);

  const { slug } = await params;
  const resolved = await getLiveStore(slug);
  if (!resolved) return fail("Store not found", 404);
  const store: Store = resolved;

  const user = await getCurrentUser();
  const data = await parseBody(req, placeOrderSchema);
  const email = data.email.toLowerCase();

  const cartMaybe = await getActiveCart(store.id);
  if (!cartMaybe || cartMaybe.items.filter((i) => !i.savedForLater).length === 0) {
    return fail("Your cart is empty.", 400);
  }
  const cart: ActiveCart = cartMaybe;

  const existingCustomer = await db.customer.findUnique({
    where: { storeId_email: { storeId: store.id, email } },
    select: { taxExempt: true },
  });

  let quote: Quote;
  try {
    quote = await computeQuote({
      store,
      items: cart.items,
      destination: { country: data.address.country, state: data.address.state ?? null },
      discountCode: data.discountCode ?? cart.discountCode,
      giftCardCode: data.giftCardCode ?? cart.giftCardCode,
      shippingRateId: data.shippingRateId ?? null,
      taxExempt: existingCustomer?.taxExempt ?? false,
    });
  } catch (error) {
    if (error instanceof CheckoutError) return fail(error.message, 400);
    throw error;
  }
  if (quote.discountError) return fail(quote.discountError, 400);
  if (quote.giftCardError) return fail(quote.giftCardError, 400);

  if (quote.totalCents !== data.expectedTotalCents) {
    return fail(
      "The order total changed while you were checking out. Please review the updated total.",
      409
    );
  }

  let method: ChargeMethod;
  let savedDisplay: { cardBrand: string | null; cardLast4: string | null } | null = null;
  if (data.payment.kind === "saved") {
    if (!user) return fail("Sign in to use a saved payment method.", 401);
    const pm = await db.paymentMethod.findFirst({
      where: { id: data.payment.paymentMethodId, userId: user.id },
    });
    if (!pm) return fail("Saved payment method not found.", 404);
    method = { kind: "saved", providerRef: pm.providerRef };
    savedDisplay = { cardBrand: pm.cardBrand, cardLast4: pm.cardLast4 };
  } else if (data.payment.kind === "card") {
    method = { kind: "card", card: data.payment.card, save: data.payment.save && Boolean(user) };
  } else {
    method = { kind: "wallet" };
  }

  const riskLevel = assessRisk({
    amountCents: quote.totalCents,
    isGuest: !user,
    itemCount: quote.lines.reduce((s, l) => s + l.quantity, 0),
  });

  const provider = getPaymentProvider();
  let charge: ChargeSuccess | null = null;
  if (quote.totalCents > 0) {
    const result = await provider.charge({
      amountCents: quote.totalCents,
      currency: quote.currency,
      description: `${store.name} order for ${email}`,
      method,
    });
    if (!result.ok) {
      await auditLog({
        action: "payment.failed",
        storeId: store.id,
        userId: user?.id ?? null,
        detail: { failureCode: result.failureCode, amountCents: quote.totalCents, email },
      });
      return fail(result.message, 402, { payment: result.failureCode });
    }
    charge = result;
  }

  let order;
  try {
    order = await db.$transaction(async (tx) => {
      for (const line of quote.lines) {
        if (line.variantId) {
          const v = await tx.productVariant.findUnique({ where: { id: line.variantId } });
          const p = await tx.product.findUnique({ where: { id: line.productId } });
          if (p?.trackInventory && (!v || v.stock < line.quantity)) {
            throw new CheckoutError(`"${line.productName}" just sold out.`);
          }
        } else {
          const p = await tx.product.findUnique({ where: { id: line.productId } });
          if (p?.trackInventory && p.stock < line.quantity) {
            throw new CheckoutError(`"${line.productName}" just sold out.`);
          }
        }
      }

      const customer = await tx.customer.upsert({
        where: { storeId_email: { storeId: store.id, email } },
        create: {
          storeId: store.id,
          email,
          name: data.address.name,
          phone: data.address.phone ?? null,
          userId: user?.id ?? null,
          addressLine1: data.address.line1,
          addressLine2: data.address.line2 ?? null,
          city: data.address.city,
          state: data.address.state ?? null,
          postalCode: data.address.postalCode,
          country: data.address.country,
        },
        update: {
          name: data.address.name,
          phone: data.address.phone ?? undefined,
          userId: user?.id ?? undefined,
        },
      });

      const last = await tx.order.findFirst({
        where: { storeId: store.id },
        orderBy: { orderNumber: "desc" },
        select: { orderNumber: true },
      });
      const orderNumber = (last?.orderNumber ?? 1000) + 1;

      const created = await tx.order.create({
        data: {
          storeId: store.id,
          orderNumber,
          customerId: user?.id ?? null,
          customerRefId: customer.id,
          customerEmail: email,
          status: "PAID",
          subtotalCents: quote.subtotalCents,
          discountCents: quote.discountCents,
          shippingCents: quote.shippingCents,
          taxCents: quote.taxCents,
          totalCents: quote.totalCents,
          currency: quote.currency,
          customerNote: data.customerNote ?? null,
          paidAt: new Date(),
          shipName: data.address.name,
          shipPhone: data.address.phone ?? null,
          shipLine1: data.address.line1,
          shipLine2: data.address.line2 ?? null,
          shipCity: data.address.city,
          shipState: data.address.state ?? null,
          shipPostalCode: data.address.postalCode,
          shipCountry: data.address.country,
          shippingMethod: quote.shippingMethod,
          discountCode:
            quote.discountCents > 0 || quote.freeShipping
              ? (data.discountCode ?? cart.discountCode)
              : null,
          giftCardCode: quote.giftCardCents > 0 ? (data.giftCardCode ?? cart.giftCardCode) : null,
          giftCardCents: quote.giftCardCents,
          items: {
            create: quote.lines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              productName: l.productName,
              variantName: l.variantName,
              quantity: l.quantity,
              unitPriceCents: l.unitPriceCents,
            })),
          },
          timeline: {
            create: [
              {
                type: "CREATED",
                message: `Order placed on the storefront by ${data.address.name}`,
              },
              {
                type: "PAYMENT",
                message:
                  quote.totalCents === 0
                    ? "Fully covered by gift card"
                    : `Payment of ${formatMoney(quote.totalCents, quote.currency)} captured (${charge?.provider ?? "gift card"})`,
              },
            ],
          },
        },
      });

      await tx.payment.create({
        data: {
          orderId: created.id,
          provider: charge?.provider ?? "gift_card",
          providerRef: charge?.providerRef ?? null,
          method: charge?.method ?? null,
          cardBrand: charge?.cardBrand ?? savedDisplay?.cardBrand ?? null,
          cardLast4: charge?.cardLast4 ?? savedDisplay?.cardLast4 ?? null,
          status: "SUCCEEDED",
          amountCents: quote.totalCents,
          currency: quote.currency,
          riskLevel,
        },
      });

      for (const line of quote.lines) {
        const product = await tx.product.findUnique({ where: { id: line.productId } });
        if (!product?.trackInventory) continue;

        if (line.variantId) {
          const updated = await tx.productVariant.update({
            where: { id: line.variantId },
            data: { stock: { decrement: line.quantity } },
          });
          await tx.inventoryAdjustment.create({
            data: {
              storeId: store.id,
              productId: line.productId,
              variantId: line.variantId,
              delta: -line.quantity,
              reason: "SALE",
              note: `Order #${orderNumber}`,
              stockAfter: updated.stock,
              actorName: "Storefront",
            },
          });
        } else {
          const updated = await tx.product.update({
            where: { id: line.productId },
            data: { stock: { decrement: line.quantity } },
          });
          await tx.inventoryAdjustment.create({
            data: {
              storeId: store.id,
              productId: line.productId,
              delta: -line.quantity,
              reason: "SALE",
              note: `Order #${orderNumber}`,
              stockAfter: updated.stock,
              actorName: "Storefront",
            },
          });
          if (updated.stock <= updated.lowStockThreshold) {
            await tx.notification.create({
              data: {
                userId: store.ownerId,
                type: "INVENTORY",
                title:
                  updated.stock <= 0
                    ? `Out of stock: ${product.name}`
                    : `Low stock: ${product.name}`,
                body: `${updated.stock} left (threshold ${updated.lowStockThreshold}).`,
                href: `/store/${store.id}/inventory`,
              },
            });
          }
        }
      }

      if (quote.discountCents > 0 || quote.freeShipping) {
        const code = (data.discountCode ?? cart.discountCode)?.toUpperCase();
        if (code) {
          await tx.discount.updateMany({
            where: { storeId: store.id, code },
            data: { usedCount: { increment: 1 } },
          });
        }
      }
      if (quote.giftCardCents > 0) {
        const code = (data.giftCardCode ?? cart.giftCardCode)?.toUpperCase();
        if (code) {
          await tx.giftCard.updateMany({
            where: { storeId: store.id, code },
            data: { balanceCents: { decrement: quote.giftCardCents } },
          });
        }
      }

      await tx.cart.update({ where: { id: cart.id }, data: { status: "CONVERTED" } });
      return created;
    });
  } catch (error) {
    if (charge) await provider.refund(charge.providerRef, quote.totalCents);
    if (error instanceof CheckoutError) {
      await auditLog({
        action: "checkout.rolled_back",
        storeId: store.id,
        userId: user?.id ?? null,
        detail: { reason: error.message },
      });
      return fail(error.message, 409);
    }
    throw error;
  }

  if (user && data.payment.kind === "card" && data.payment.save) {
    const tokenized = charge?.savedMethodRef
      ? {
          token: charge.savedMethodRef,
          brand: charge.cardBrand ?? "Card",
          last4: charge.cardLast4 ?? "",
        }
      : tokenizeCard(data.payment.card);
    const count = await db.paymentMethod.count({ where: { userId: user.id } });
    await db.paymentMethod.create({
      data: {
        userId: user.id,
        provider: charge?.provider ?? "foundry_pay",
        providerRef: tokenized.token,
        method: "card",
        cardBrand: tokenized.brand,
        cardLast4: tokenized.last4,
        expMonth: data.payment.card.expMonth,
        expYear: data.payment.card.expYear,
        isDefault: count === 0,
      },
    });
  }

  await auditLog({
    action: "checkout.placed",
    storeId: store.id,
    userId: user?.id ?? null,
    detail: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalCents: order.totalCents,
      riskLevel,
      guest: !user,
    },
  });
  await trackEvent("order.created", {
    userId: user?.id ?? undefined,
    storeId: store.id,
    payload: { orderId: order.id, totalCents: order.totalCents, source: "storefront" },
  });

  await onOrderEvent(store.id, "ORDER_CREATED", {
    id: order.id,
    orderNumber: order.orderNumber,
    totalCents: order.totalCents,
    customerEmail: order.customerEmail,
  });

  await createNotification({
    userId: store.ownerId,
    type: "ORDER",
    title: `New order #${order.orderNumber}`,
    body: `${data.address.name} — ${formatMoney(order.totalCents, order.currency)}`,
    href: `/store/${store.id}/orders/${order.id}`,
  });
  await createNotification({
    userId: store.ownerId,
    type: "PAYMENT",
    title: `Payment received for #${order.orderNumber}`,
    body: `${formatMoney(order.totalCents, order.currency)} via ${charge?.provider ?? "gift card"}${riskLevel !== "low" ? ` — risk: ${riskLevel}` : ""}`,
    href: `/store/${store.id}/orders/${order.id}`,
  });

  if (user) {
    await createNotification({
      userId: user.id,
      type: "ORDER",
      title: `Order #${order.orderNumber} confirmed`,
      body: `Your ${store.name} order for ${formatMoney(order.totalCents, order.currency)} is confirmed.`,
      href: `/account/orders/${order.id}`,
    });
  }

  const itemsText = quote.lines
    .map((l) => `  ${l.quantity} × ${l.productName}${l.variantName ? ` (${l.variantName})` : ""}`)
    .join("\n");
  const confirm = orderConfirmationEmail({
    store: { name: store.name, slug: store.slug },
    orderNumber: order.orderNumber,
    totalCents: order.totalCents,
    currency: order.currency,
    buyerName: data.address.name,
    orderId: order.id,
  });
  await sendMail({
    to: email,
    subject: confirm.subject,
    text: `${confirm.text}\n\nItems:\n${itemsText}`,
    html: confirm.html.replace("</div>", `<p style="margin-top:12px;font-size:13px;">${itemsText.replace(/\n/g, "<br/>")}</p></div>`),
  });

  return ok(
    {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalCents: order.totalCents,
        currency: order.currency,
        status: order.status,
      },
    },
    { status: 201 }
  );
});
