import { cookies } from "next/headers";
import { randomBytes } from "crypto";

import { db } from "@/lib/db";
import { CART_COOKIE, CART_TTL_DAYS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth/session";

/** Reads the visitor's cart token, creating and setting it when allowed.
 *  Server components can only read cookies, so `create` defaults to false
 *  there; route handlers pass true. */
export async function getCartToken(create = false): Promise<string | null> {
  const store = await cookies();
  const existing = store.get(CART_COOKIE)?.value;
  if (existing && /^[a-f0-9]{32}$/.test(existing)) return existing;
  if (!create) return null;

  const token = randomBytes(16).toString("hex");
  store.set(CART_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_TTL_DAYS * 24 * 60 * 60,
  });
  return token;
}

export const CART_ITEM_INCLUDE = {
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      visibility: true,
      priceCents: true,
      compareAtCents: true,
      currency: true,
      trackInventory: true,
      stock: true,
      requiresShipping: true,
      images: { orderBy: { position: "asc" as const }, take: 1 },
    },
  },
  variant: {
    select: { id: true, name: true, priceCents: true, stock: true },
  },
} as const;

/**
 * Resolves the visitor's active cart for a store. Logged-in visitors adopt
 * any guest cart created under their cookie token (cart merge on login).
 */
export async function getActiveCart(storeId: string, opts?: { create?: boolean }) {
  const user = await getCurrentUser();
  const token = await getCartToken(opts?.create ?? false);

  let cart = null;
  if (token) {
    cart = await db.cart.findFirst({
      where: { token, storeId, status: "ACTIVE" },
      include: { items: { include: CART_ITEM_INCLUDE, orderBy: { createdAt: "asc" } } },
    });
  }
  if (!cart && user) {
    // Cart started on another device/browser under this account.
    cart = await db.cart.findFirst({
      where: { userId: user.id, storeId, status: "ACTIVE" },
      include: { items: { include: CART_ITEM_INCLUDE, orderBy: { createdAt: "asc" } } },
    });
  }

  if (cart && user && !cart.userId) {
    await db.cart.update({ where: { id: cart.id }, data: { userId: user.id } });
    cart = { ...cart, userId: user.id };
  }

  if (!cart && opts?.create && token) {
    const created = await db.cart.create({
      data: { token, storeId, userId: user?.id ?? null },
    });
    cart = { ...created, items: [] };
  }

  return cart;
}

export function itemUnitPriceCents(item: {
  product: { priceCents: number };
  variant: { priceCents: number | null } | null;
}): number {
  return item.variant?.priceCents ?? item.product.priceCents;
}

export function availableStock(item: {
  product: { trackInventory: boolean; stock: number };
  variant: { stock: number } | null;
}): number | null {
  if (!item.product.trackInventory) return null; // unlimited
  return item.variant ? item.variant.stock : item.product.stock;
}
