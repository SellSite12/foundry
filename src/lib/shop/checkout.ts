// The checkout pricing engine: turns a cart + destination + codes into an
// exact quote (lines, discount, shipping options, tax, gift card, total).
// Both the quote API (steps 1-5 of checkout) and order placement share this
// logic so the charged amount always matches what was displayed.

import type { Discount, GiftCard, ShippingRate, Store, TaxRule } from "@prisma/client";

import { db } from "@/lib/db";

export type QuoteLine = {
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  imageUrl: string | null;
  requiresShipping: boolean;
};

export type ShippingOption = {
  id: string;
  name: string;
  kind: string; // DELIVERY | PICKUP
  priceCents: number;
  freeApplied: boolean;
  minDays: number | null;
  maxDays: number | null;
};

export type Quote = {
  lines: QuoteLine[];
  subtotalCents: number;
  discountCents: number;
  discountError: string | null;
  discountTitle: string | null;
  freeShipping: boolean;
  shippingOptions: ShippingOption[];
  shippingCents: number;
  shippingMethod: string | null;
  taxCents: number;
  taxRatePercent: number;
  taxInclusive: boolean;
  taxExempt: boolean;
  giftCardCents: number;
  giftCardError: string | null;
  giftCardBalanceCents: number | null;
  totalCents: number;
  currency: string;
};

type CartItemForQuote = {
  quantity: number;
  savedForLater: boolean;
  product: {
    id: string;
    name: string;
    status: string;
    visibility: string;
    priceCents: number;
    trackInventory: boolean;
    stock: number;
    requiresShipping: boolean;
    images: { url: string }[];
  };
  variant: { id: string; name: string; priceCents: number | null; stock: number } | null;
};

export class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutError";
  }
}

/** Validates purchasability and builds price-snapshotted lines. */
export function buildLines(items: CartItemForQuote[]): QuoteLine[] {
  const lines: QuoteLine[] = [];
  for (const item of items) {
    if (item.savedForLater) continue;
    const p = item.product;
    if (p.status !== "PUBLISHED" || p.visibility !== "VISIBLE") {
      throw new CheckoutError(`"${p.name}" is no longer available.`);
    }
    const stock = p.trackInventory ? (item.variant ? item.variant.stock : p.stock) : null;
    if (stock !== null && item.quantity > stock) {
      throw new CheckoutError(
        stock <= 0
          ? `"${p.name}" is out of stock.`
          : `Only ${stock} of "${p.name}" left in stock.`
      );
    }
    const unit = item.variant?.priceCents ?? p.priceCents;
    lines.push({
      productId: p.id,
      variantId: item.variant?.id ?? null,
      productName: p.name,
      variantName: item.variant?.name ?? null,
      quantity: item.quantity,
      unitPriceCents: unit,
      lineTotalCents: unit * item.quantity,
      imageUrl: p.images[0]?.url ?? null,
      requiresShipping: p.requiresShipping,
    });
  }
  if (lines.length === 0) throw new CheckoutError("Your cart is empty.");
  return lines;
}

export function resolveDiscount(
  discount: Discount | null,
  subtotalCents: number
): { discountCents: number; freeShipping: boolean; error: string | null; title: string | null } {
  if (!discount) return { discountCents: 0, freeShipping: false, error: null, title: null };

  const now = new Date();
  if (discount.status !== "ACTIVE") {
    return { discountCents: 0, freeShipping: false, error: "This code is no longer active.", title: null };
  }
  if (discount.startsAt && discount.startsAt > now) {
    return { discountCents: 0, freeShipping: false, error: "This code isn't active yet.", title: null };
  }
  if (discount.endsAt && discount.endsAt < now) {
    return { discountCents: 0, freeShipping: false, error: "This code has expired.", title: null };
  }
  if (discount.usageLimit !== null && discount.usedCount >= discount.usageLimit) {
    return { discountCents: 0, freeShipping: false, error: "This code has reached its usage limit.", title: null };
  }
  if (discount.minSubtotalCents !== null && subtotalCents < discount.minSubtotalCents) {
    return {
      discountCents: 0,
      freeShipping: false,
      error: `This code requires a minimum subtotal of ${(discount.minSubtotalCents / 100).toFixed(2)}.`,
      title: null,
    };
  }

  if (discount.type === "FREE_SHIPPING") {
    return { discountCents: 0, freeShipping: true, error: null, title: discount.title };
  }
  if (discount.type === "PERCENT") {
    const cents = Math.min(subtotalCents, Math.round((subtotalCents * discount.value) / 100));
    return { discountCents: cents, freeShipping: false, error: null, title: discount.title };
  }
  // FIXED_AMOUNT
  return {
    discountCents: Math.min(subtotalCents, discount.value),
    freeShipping: false,
    error: null,
    title: discount.title,
  };
}

function rateMatchesCountry(rate: ShippingRate, country: string | null): boolean {
  if (rate.kind === "PICKUP") return true;
  if (!rate.countries?.trim()) return true; // everywhere
  if (!country) return false;
  const list = rate.countries.split(",").map((c) => c.trim().toLowerCase());
  return list.includes(country.trim().toLowerCase());
}

export function buildShippingOptions(
  rates: ShippingRate[],
  opts: {
    country: string | null;
    discountedSubtotalCents: number;
    freeShipping: boolean;
    anyShippable: boolean;
  }
): ShippingOption[] {
  if (!opts.anyShippable) {
    // Digital-only order: no shipping needed.
    return [
      { id: "none", name: "No shipping needed", kind: "NONE", priceCents: 0, freeApplied: false, minDays: null, maxDays: null },
    ];
  }
  return rates
    .filter((r) => r.active && rateMatchesCountry(r, opts.country))
    .map((r) => {
      const free =
        opts.freeShipping ||
        (r.freeAboveCents !== null && opts.discountedSubtotalCents >= r.freeAboveCents);
      return {
        id: r.id,
        name: r.name,
        kind: r.kind,
        priceCents: free ? 0 : r.priceCents,
        freeApplied: free && r.priceCents > 0,
        minDays: r.minDays,
        maxDays: r.maxDays,
      };
    });
}

/** Most specific active rule wins: country+state → country → "*" → store default. */
export function resolveTaxRate(
  store: Pick<Store, "taxRate" | "taxInclusive">,
  rules: TaxRule[],
  destination: { country: string | null; state: string | null }
): number {
  const active = rules.filter((r) => r.active);
  const country = destination.country?.trim().toLowerCase() ?? null;
  const state = destination.state?.trim().toLowerCase() ?? null;

  if (country) {
    if (state) {
      const exact = active.find(
        (r) =>
          r.country.trim().toLowerCase() === country &&
          r.state?.trim().toLowerCase() === state
      );
      if (exact) return exact.rate;
    }
    const countryRule = active.find(
      (r) => r.country.trim().toLowerCase() === country && !r.state
    );
    if (countryRule) return countryRule.rate;
  }
  const anywhere = active.find((r) => r.country.trim() === "*" && !r.state);
  if (anywhere) return anywhere.rate;
  return store.taxRate;
}

export function resolveGiftCard(
  giftCard: GiftCard | null,
  payableCents: number
): { applied: number; balance: number | null; error: string | null } {
  if (!giftCard) return { applied: 0, balance: null, error: null };
  if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
    return { applied: 0, balance: null, error: "This gift card has expired." };
  }
  if (giftCard.balanceCents <= 0) {
    return { applied: 0, balance: 0, error: "This gift card has no remaining balance." };
  }
  return {
    applied: Math.min(giftCard.balanceCents, payableCents),
    balance: giftCard.balanceCents,
    error: null,
  };
}

export type QuoteInput = {
  store: Store;
  items: CartItemForQuote[];
  destination: { country: string | null; state: string | null };
  discountCode: string | null;
  giftCardCode: string | null;
  shippingRateId: string | null; // chosen option; null = cheapest
  taxExempt?: boolean;
};

/** Picks the best automatic discount when the shopper has not entered a code. */
async function resolveAutomaticDiscount(
  storeId: string,
  subtotalCents: number
): Promise<ReturnType<typeof resolveDiscount>> {
  const automatics = await db.discount.findMany({
    where: { storeId, kind: "AUTOMATIC", status: "ACTIVE" },
  });
  let best: ReturnType<typeof resolveDiscount> = {
    discountCents: 0,
    freeShipping: false,
    error: null,
    title: null,
  };
  for (const d of automatics) {
    const res = resolveDiscount(d, subtotalCents);
    if (res.error) continue;
    const value = res.discountCents + (res.freeShipping ? 1 : 0);
    const bestValue = best.discountCents + (best.freeShipping ? 1 : 0);
    if (value > bestValue) best = res;
  }
  return best;
}

export async function computeQuote(input: QuoteInput): Promise<Quote> {
  const { store } = input;
  const lines = buildLines(input.items);
  const subtotalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);

  // Discount: explicit code wins; otherwise apply the best automatic discount.
  let discountRes: ReturnType<typeof resolveDiscount>;
  if (input.discountCode) {
    const discount = await db.discount.findFirst({
      where: {
        storeId: store.id,
        code: input.discountCode.toUpperCase(),
        kind: { in: ["CODE", "BUNDLE"] },
      },
    });
    discountRes = !discount
      ? { discountCents: 0, freeShipping: false, error: "Unknown discount code.", title: null }
      : resolveDiscount(discount, subtotalCents);
  } else {
    discountRes = await resolveAutomaticDiscount(store.id, subtotalCents);
  }
  const discountedSubtotal = subtotalCents - discountRes.discountCents;

  // Shipping
  const anyShippable = lines.some((l) => l.requiresShipping);
  const rates = await db.shippingRate.findMany({
    where: { storeId: store.id, active: true },
    orderBy: { priceCents: "asc" },
  });
  const shippingOptions = buildShippingOptions(rates, {
    country: input.destination.country,
    discountedSubtotalCents: discountedSubtotal,
    freeShipping: discountRes.freeShipping,
    anyShippable,
  });
  const chosen =
    shippingOptions.find((o) => o.id === input.shippingRateId) ?? shippingOptions[0] ?? null;
  const shippingCents = chosen?.priceCents ?? 0;

  // Tax
  const taxRules = await db.taxRule.findMany({ where: { storeId: store.id } });
  const taxRatePercent = input.taxExempt
    ? 0
    : resolveTaxRate(store, taxRules, input.destination);
  const taxCents = store.taxInclusive
    ? 0 // inclusive pricing: tax is inside the item prices, not added on top
    : Math.round((discountedSubtotal * taxRatePercent) / 100);

  const payable = discountedSubtotal + shippingCents + taxCents;

  // Gift card
  const giftCard = input.giftCardCode
    ? await db.giftCard.findFirst({
        where: { storeId: store.id, code: input.giftCardCode.toUpperCase() },
      })
    : null;
  const giftRes = input.giftCardCode && !giftCard
    ? { applied: 0, balance: null, error: "Unknown gift card code." }
    : resolveGiftCard(giftCard, payable);

  return {
    lines,
    subtotalCents,
    discountCents: discountRes.discountCents,
    discountError: discountRes.error,
    discountTitle: discountRes.title,
    freeShipping: discountRes.freeShipping,
    shippingOptions,
    shippingCents,
    shippingMethod: chosen?.name ?? null,
    taxCents,
    taxRatePercent,
    taxInclusive: store.taxInclusive,
    taxExempt: Boolean(input.taxExempt),
    giftCardCents: giftRes.applied,
    giftCardError: giftRes.error,
    giftCardBalanceCents: giftRes.balance,
    totalCents: Math.max(0, payable - giftRes.applied),
    currency: store.currency,
  };
}
