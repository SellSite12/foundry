import { NextRequest } from "next/server";

import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { getLiveStore } from "@/lib/shop/storefront";
import { getActiveCart } from "@/lib/shop/cart";
import { computeQuote, CheckoutError } from "@/lib/shop/checkout";
import { quoteSchema } from "@/lib/validation/shop";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

/**
 * Prices the current cart for a destination + codes without placing an
 * order. Checkout steps 1-5 call this whenever an input changes, so the
 * review step always shows the exact amount that will be charged.
 */
export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) return fail("Store not found", 404);

  const cart = await getActiveCart(store.id);
  if (!cart || cart.items.filter((i) => !i.savedForLater).length === 0) {
    return fail("Your cart is empty.", 400);
  }

  const data = await parseBody(req, quoteSchema);

  // Tax exemption is a CRM property of the store's customer record.
  const user = await getCurrentUser();
  let taxExempt = false;
  if (user) {
    const customer = await db.customer.findUnique({
      where: { storeId_email: { storeId: store.id, email: user.email } },
      select: { taxExempt: true },
    });
    taxExempt = customer?.taxExempt ?? false;
  }

  try {
    const quote = await computeQuote({
      store,
      items: cart.items,
      destination: { country: data.country ?? null, state: data.state ?? null },
      discountCode: data.discountCode ?? cart.discountCode,
      giftCardCode: data.giftCardCode ?? cart.giftCardCode,
      shippingRateId: data.shippingRateId ?? null,
      taxExempt,
    });
    return ok({ quote });
  } catch (error) {
    if (error instanceof CheckoutError) return fail(error.message, 400);
    throw error;
  }
});
