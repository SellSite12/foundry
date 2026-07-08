import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getLiveStore, trackVisit } from "@/lib/shop/storefront";
import { getActiveCart } from "@/lib/shop/cart";
import { getCurrentUser } from "@/lib/auth/session";
import { CheckoutFlow } from "@/components/storefront/CheckoutFlow";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) notFound();
  await trackVisit(store.id, `/shop/${slug}/checkout`);

  const cart = await getActiveCart(store.id);
  if (!cart || cart.items.filter((i) => !i.savedForLater).length === 0) {
    redirect(`/shop/${slug}/cart`);
  }

  const user = await getCurrentUser();
  const [addresses, methods] = user
    ? await Promise.all([
        db.address.findMany({
          where: { userId: user.id },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        }),
        db.paymentMethod.findMany({
          where: { userId: user.id },
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            cardBrand: true,
            cardLast4: true,
            expMonth: true,
            expYear: true,
            isDefault: true,
          },
        }),
      ])
    : [[], []];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--sf-text)" }}>
          Checkout
        </h1>
        <Link href={`/shop/${slug}/cart`} className="text-[13px] font-medium hover:opacity-75" style={{ color: "var(--sf-primary)" }}>
          ← Back to cart
        </Link>
      </div>

      <CheckoutFlow
        slug={slug}
        userEmail={user?.email ?? null}
        savedAddresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          name: a.name,
          phone: a.phone,
          line1: a.line1,
          line2: a.line2,
          city: a.city,
          state: a.state,
          postalCode: a.postalCode,
          country: a.country,
          isDefault: a.isDefault,
        }))}
        savedMethods={methods}
        initialDiscountCode={cart.discountCode}
        initialGiftCardCode={cart.giftCardCode}
      />
    </div>
  );
}
