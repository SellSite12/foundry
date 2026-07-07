import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { getLiveStore, publicProductWhere } from "@/lib/shop/storefront";
import {
  getActiveCart,
  getCartToken,
  CART_ITEM_INCLUDE,
  itemUnitPriceCents,
  availableStock,
} from "@/lib/shop/cart";
import { addToCartSchema, updateCartItemSchema, cartCodesSchema } from "@/lib/validation/shop";
import { rateLimit } from "@/lib/rate-limit";

type CartWithItems = NonNullable<Awaited<ReturnType<typeof getActiveCart>>>;

function serializeCart(cart: CartWithItems | null) {
  if (!cart) {
    return {
      id: null,
      items: [],
      savedItems: [],
      subtotalCents: 0,
      itemCount: 0,
      discountCode: null,
      giftCardCode: null,
    };
  }
  const active = cart.items.filter((i) => !i.savedForLater);
  const saved = cart.items.filter((i) => i.savedForLater);
  const mapItem = (i: (typeof cart.items)[number]) => ({
    id: i.id,
    productId: i.productId,
    variantId: i.variantId,
    name: i.product.name,
    slug: i.product.slug,
    variantName: i.variant?.name ?? null,
    quantity: i.quantity,
    unitPriceCents: itemUnitPriceCents(i),
    compareAtCents: i.product.compareAtCents,
    imageUrl: i.product.images[0]?.url ?? null,
    availableStock: availableStock(i),
    unavailable: i.product.status !== "PUBLISHED" || i.product.visibility !== "VISIBLE",
    requiresShipping: i.product.requiresShipping,
    savedForLater: i.savedForLater,
  });
  return {
    id: cart.id,
    items: active.map(mapItem),
    savedItems: saved.map(mapItem),
    subtotalCents: active.reduce((s, i) => s + itemUnitPriceCents(i) * i.quantity, 0),
    itemCount: active.reduce((s, i) => s + i.quantity, 0),
    discountCode: cart.discountCode,
    giftCardCode: cart.giftCardCode,
  };
}

async function reloadCart(cartId: string) {
  return db.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: CART_ITEM_INCLUDE, orderBy: { createdAt: "asc" } } },
  });
}

export const GET = withErrorHandling(async (_req, { params }) => {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) return fail("Store not found", 404);

  const cart = await getActiveCart(store.id);
  return ok({ cart: serializeCart(cart) });
});

/** Adds a product (or variant) to the cart, creating the cart if needed. */
export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  rateLimit(req, "cart", 120, 60_000);
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) return fail("Store not found", 404);

  const data = await parseBody(req, addToCartSchema);

  const product = await db.product.findFirst({
    where: { ...publicProductWhere(store.id), id: data.productId },
    include: { variants: true },
  });
  if (!product) return fail("This product is not available", 404);

  let variant = null;
  if (data.variantId) {
    variant = product.variants.find((v) => v.id === data.variantId) ?? null;
    if (!variant) return fail("This option is not available", 400);
  } else if (product.variants.length > 0) {
    return fail("Please choose an option first", 400);
  }

  const cart = await getActiveCart(store.id, { create: true });
  if (!cart) {
    // Cookie couldn't be set (should not happen in route handlers).
    await getCartToken(true);
    return fail("Could not start a cart. Please enable cookies.", 400);
  }

  const existing = await db.cartItem.findFirst({
    where: { cartId: cart.id, productId: product.id, variantId: variant?.id ?? null },
  });

  const stock = product.trackInventory ? (variant ? variant.stock : product.stock) : null;
  const nextQty = (existing?.quantity ?? 0) + data.quantity;
  if (stock !== null && nextQty > stock) {
    return fail(
      stock <= 0 ? "This item is out of stock." : `Only ${stock} left in stock.`,
      400
    );
  }

  if (existing) {
    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQty, savedForLater: false },
    });
  } else {
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        variantId: variant?.id ?? null,
        quantity: data.quantity,
      },
    });
  }
  await db.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });

  const fresh = await reloadCart(cart.id);
  return ok({ cart: serializeCart(fresh) }, { status: 201 });
});

/** Updates quantity (0 removes) or moves an item between cart and saved-for-later. */
export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) return fail("Store not found", 404);

  const cart = await getActiveCart(store.id);
  if (!cart) return fail("No active cart", 404);

  const data = await parseBody(req, updateCartItemSchema);
  const item = cart.items.find((i) => i.id === data.itemId);
  if (!item) return fail("Item not in cart", 404);

  if (data.quantity === 0) {
    await db.cartItem.delete({ where: { id: item.id } });
  } else {
    if (data.quantity !== undefined) {
      const stock = availableStock(item);
      if (stock !== null && data.quantity > stock) {
        return fail(
          stock <= 0 ? "This item is out of stock." : `Only ${stock} left in stock.`,
          400
        );
      }
    }
    await db.cartItem.update({
      where: { id: item.id },
      data: {
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.savedForLater !== undefined && { savedForLater: data.savedForLater }),
      },
    });
  }
  await db.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });

  const fresh = await reloadCart(cart.id);
  return ok({ cart: serializeCart(fresh) });
});

/** Applies/clears promo and gift card codes on the cart. */
export const PUT = withErrorHandling(async (req: NextRequest, { params }) => {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) return fail("Store not found", 404);

  const cart = await getActiveCart(store.id, { create: true });
  if (!cart) return fail("No active cart", 404);

  const data = await parseBody(req, cartCodesSchema);
  await db.cart.update({
    where: { id: cart.id },
    data: {
      ...(data.discountCode !== undefined && {
        discountCode: data.discountCode ? data.discountCode.toUpperCase() : null,
      }),
      ...(data.giftCardCode !== undefined && {
        giftCardCode: data.giftCardCode ? data.giftCardCode.toUpperCase() : null,
      }),
    },
  });

  const fresh = await reloadCart(cart.id);
  return ok({ cart: serializeCart(fresh) });
});

/** Removes one item (?itemId=) or clears the whole cart. */
export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) return fail("Store not found", 404);

  const cart = await getActiveCart(store.id);
  if (!cart) return fail("No active cart", 404);

  const itemId = req.nextUrl.searchParams.get("itemId");
  if (itemId) {
    await db.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  } else {
    await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  const fresh = await reloadCart(cart.id);
  return ok({ cart: serializeCart(fresh) });
});
