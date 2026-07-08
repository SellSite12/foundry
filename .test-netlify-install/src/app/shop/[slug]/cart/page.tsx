import { notFound } from "next/navigation";

import { getLiveStore, trackVisit } from "@/lib/shop/storefront";
import { getActiveCart, itemUnitPriceCents, availableStock } from "@/lib/shop/cart";
import { CartView, type CartData } from "@/components/storefront/CartView";

export const metadata = { title: "Cart" };

export default async function CartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) notFound();
  await trackVisit(store.id, `/shop/${slug}/cart`);

  const cart = await getActiveCart(store.id);
  const items = cart?.items ?? [];
  const active = items.filter((i) => !i.savedForLater);

  const mapItem = (i: (typeof items)[number]) => ({
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

  const initialCart: CartData = {
    id: cart?.id ?? null,
    items: active.map(mapItem),
    savedItems: items.filter((i) => i.savedForLater).map(mapItem),
    subtotalCents: active.reduce((s, i) => s + itemUnitPriceCents(i) * i.quantity, 0),
    itemCount: active.reduce((s, i) => s + i.quantity, 0),
    discountCode: cart?.discountCode ?? null,
    giftCardCode: cart?.giftCardCode ?? null,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--sf-text)" }}>
        Your cart
      </h1>
      <CartView slug={slug} currency={store.currency} initialCart={initialCart} />
    </div>
  );
}
