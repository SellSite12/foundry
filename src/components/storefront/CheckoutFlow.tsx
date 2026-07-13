"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { api } from "@/lib/client/api";
import { formatMoney } from "@/lib/money";
import { emitCartUpdated } from "@/components/storefront/CartBadge";

type QuoteLine = {
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  imageUrl: string | null;
};

type ShippingOption = {
  id: string;
  name: string;
  kind: string;
  priceCents: number;
  freeApplied: boolean;
  minDays: number | null;
  maxDays: number | null;
};

type Quote = {
  lines: QuoteLine[];
  subtotalCents: number;
  discountCents: number;
  discountError: string | null;
  discountTitle: string | null;
  shippingOptions: ShippingOption[];
  shippingCents: number;
  shippingMethod: string | null;
  taxCents: number;
  taxRatePercent: number;
  taxInclusive: boolean;
  giftCardCents: number;
  giftCardError: string | null;
  totalCents: number;
  currency: string;
};

type SavedAddress = {
  id: string;
  label: string;
  name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type SavedMethod = {
  id: string;
  cardBrand: string | null;
  cardLast4: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
};

type AddressForm = {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type PlacedOrder = { id: string; orderNumber: number; totalCents: number; currency: string };

const STEPS = ["Contact", "Address", "Shipping", "Payment", "Review"] as const;

const inputStyle: React.CSSProperties = {
  borderRadius: "8px",
  border: "1px solid var(--sf-line)",
  background: "var(--sf-bg)",
  color: "var(--sf-text)",
};

export function CheckoutFlow({
  slug,
  userEmail,
  savedAddresses,
  savedMethods,
  initialDiscountCode,
  initialGiftCardCode,
}: {
  slug: string;
  userEmail: string | null;
  savedAddresses: SavedAddress[];
  savedMethods: SavedMethod[];
  initialDiscountCode: string | null;
  initialGiftCardCode: string | null;
}) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState(userEmail ?? "");
  const defaultAddress = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0] ?? null;
  const [address, setAddress] = useState<AddressForm>({
    name: defaultAddress?.name ?? "",
    phone: defaultAddress?.phone ?? "",
    line1: defaultAddress?.line1 ?? "",
    line2: defaultAddress?.line2 ?? "",
    city: defaultAddress?.city ?? "",
    state: defaultAddress?.state ?? "",
    postalCode: defaultAddress?.postalCode ?? "",
    country: defaultAddress?.country ?? "",
  });
  const [shippingRateId, setShippingRateId] = useState<string | null>(null);

  const defaultMethod = savedMethods.find((m) => m.isDefault) ?? savedMethods[0] ?? null;
  const [payKind, setPayKind] = useState<"card" | "saved" | "wallet">(defaultMethod ? "saved" : "card");
  const [savedMethodId, setSavedMethodId] = useState<string | null>(defaultMethod?.id ?? null);
  const [card, setCard] = useState({ number: "", expMonth: "", expYear: "", cvc: "", name: "" });
  const [saveCard, setSaveCard] = useState(false);
  const [customerNote, setCustomerNote] = useState("");

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  const refreshQuote = useCallback(
    async (rateId: string | null) => {
      setQuoteError(null);
      const res = await api<{ quote: Quote }>(`/api/shop/${slug}/quote`, {
        method: "POST",
        body: {
          country: address.country || null,
          state: address.state || null,
          shippingRateId: rateId,
        },
      });
      if (!res.ok) {
        setQuoteError(res.error);
        return null;
      }
      setQuote(res.data.quote);
      return res.data.quote;
    },
    [slug, address.country, address.state]
  );

  useEffect(() => {
    refreshQuote(shippingRateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function nextFromAddress() {
    setBusy(true);
    const q = await refreshQuote(shippingRateId);
    setBusy(false);
    if (!q) return;
    // Default to the first (cheapest) shipping option.
    if (!shippingRateId && q.shippingOptions.length > 0) {
      setShippingRateId(q.shippingOptions[0].id);
    }
    setStep(2);
  }

  async function chooseShipping(id: string) {
    setShippingRateId(id);
    setBusy(true);
    await refreshQuote(id);
    setBusy(false);
  }

  async function placeOrder() {
    if (!quote) return;
    setPlacing(true);
    setError(null);
    setFieldErrors({});

    const payment =
      payKind === "saved" && savedMethodId
        ? { kind: "saved" as const, paymentMethodId: savedMethodId }
        : payKind === "wallet"
          ? { kind: "wallet" as const }
          : {
              kind: "card" as const,
              card: {
                number: card.number,
                expMonth: parseInt(card.expMonth, 10) || 0,
                expYear: parseInt(card.expYear, 10) || 0,
                cvc: card.cvc,
                name: card.name,
              },
              save: saveCard,
            };

    const res = await api<{ order: PlacedOrder }>(`/api/shop/${slug}/checkout`, {
      method: "POST",
      body: {
        email,
        address: {
          name: address.name,
          phone: address.phone || null,
          line1: address.line1,
          line2: address.line2 || null,
          city: address.city,
          state: address.state || null,
          postalCode: address.postalCode,
          country: address.country,
        },
        shippingRateId,
        customerNote: customerNote || null,
        payment,
        expectedTotalCents: quote.totalCents,
      },
    });
    setPlacing(false);
    if (!res.ok) {
      setError(res.error);
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      // Price drift: refresh the quote so the user can re-review.
      await refreshQuote(shippingRateId);
      return;
    }
    setPlaced(res.data.order);
    emitCartUpdated(0);
  }

  // ---------- Confirmation (step 6) ----------
  if (placed) {
    return (
      <div
        className="mx-auto mt-10 max-w-lg border p-8 text-center"
        style={{ borderRadius: "var(--sf-radius)", borderColor: "var(--sf-card-border)", background: "var(--sf-surface)" }}
      >
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white"
          style={{ background: "#22C55E" }}
          aria-hidden
        >
          ✓
        </div>
        <h2 className="mt-4 text-2xl font-bold" style={{ color: "var(--sf-text)" }}>
          Order confirmed!
        </h2>
        <p className="mt-2 text-[14.5px]" style={{ color: "var(--sf-text-dim)" }}>
          Order <strong style={{ color: "var(--sf-text)" }}>#{placed.orderNumber}</strong> — {formatMoney(placed.totalCents, placed.currency)}.
          A confirmation email is on its way to <strong style={{ color: "var(--sf-text)" }}>{email}</strong>.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={`/shop/${slug}/track`}
            className="w-full px-5 py-3 text-[14px] font-semibold text-white"
            style={{ background: "var(--sf-primary)", borderRadius: "var(--sf-btn-radius)" }}
          >
            Track your order
          </Link>
          <Link
            href={`/shop/${slug}/products`}
            className="w-full border px-5 py-3 text-[14px] font-semibold"
            style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "var(--sf-line)", color: "var(--sf-text)" }}
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  const summary = quote ? (
    <aside
      aria-label="Order summary"
      className="h-fit border p-5"
      style={{ borderRadius: "var(--sf-radius)", borderColor: "var(--sf-card-border)", background: "var(--sf-surface)" }}
    >
      <h2 className="text-[15px] font-semibold" style={{ color: "var(--sf-text)" }}>Order summary</h2>
      <ul className="mt-4 space-y-3">
        {quote.lines.map((l, i) => (
          <li key={i} className="flex items-center gap-3 text-[13px]">
            <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg" style={{ background: "var(--sf-bg)" }}>
              {l.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
              ) : null}
            </span>
            <span className="flex-1" style={{ color: "var(--sf-text)" }}>
              {l.quantity} × {l.productName}
              {l.variantName ? <span style={{ color: "var(--sf-text-dim)" }}> ({l.variantName})</span> : null}
            </span>
            <span className="font-medium" style={{ color: "var(--sf-text)" }}>
              {formatMoney(l.lineTotalCents, quote.currency)}
            </span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-1.5 border-t pt-4 text-[13.5px]" style={{ borderColor: "var(--sf-line)" }}>
        <div className="flex justify-between">
          <dt style={{ color: "var(--sf-text-dim)" }}>Subtotal</dt>
          <dd style={{ color: "var(--sf-text)" }}>{formatMoney(quote.subtotalCents, quote.currency)}</dd>
        </div>
        {quote.discountCents > 0 ? (
          <div className="flex justify-between">
            <dt style={{ color: "var(--sf-text-dim)" }}>Discount{quote.discountTitle ? ` (${quote.discountTitle})` : ""}</dt>
            <dd style={{ color: "#22C55E" }}>−{formatMoney(quote.discountCents, quote.currency)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt style={{ color: "var(--sf-text-dim)" }}>Shipping{quote.shippingMethod ? ` (${quote.shippingMethod})` : ""}</dt>
          <dd style={{ color: "var(--sf-text)" }}>
            {quote.shippingCents === 0 ? "Free" : formatMoney(quote.shippingCents, quote.currency)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt style={{ color: "var(--sf-text-dim)" }}>
            Tax{quote.taxInclusive ? " (included)" : quote.taxRatePercent > 0 ? ` (${quote.taxRatePercent}%)` : ""}
          </dt>
          <dd style={{ color: "var(--sf-text)" }}>{formatMoney(quote.taxCents, quote.currency)}</dd>
        </div>
        {quote.giftCardCents > 0 ? (
          <div className="flex justify-between">
            <dt style={{ color: "var(--sf-text-dim)" }}>Gift card</dt>
            <dd style={{ color: "#22C55E" }}>−{formatMoney(quote.giftCardCents, quote.currency)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between border-t pt-2 text-[15px] font-bold" style={{ borderColor: "var(--sf-line)" }}>
          <dt style={{ color: "var(--sf-text)" }}>Total</dt>
          <dd style={{ color: "var(--sf-text)" }}>{formatMoney(quote.totalCents, quote.currency)}</dd>
        </div>
      </dl>
      {initialDiscountCode || initialGiftCardCode ? (
        <p className="mt-3 text-[12px]" style={{ color: "var(--sf-text-dim)" }}>
          Codes applied from your cart{quote.discountError ? ` — ${quote.discountError}` : ""}{quote.giftCardError ? ` — ${quote.giftCardError}` : ""}.
        </p>
      ) : null}
    </aside>
  ) : quoteError ? (
    <aside className="h-fit border p-5 text-[13.5px]" style={{ borderRadius: "var(--sf-radius)", borderColor: "#EF4444", color: "#EF4444" }}>
      {quoteError}{" "}
      <Link href={`/shop/${slug}/cart`} className="underline">Back to cart</Link>
    </aside>
  ) : (
    <aside className="h-fit animate-pulse border p-5" style={{ borderRadius: "var(--sf-radius)", borderColor: "var(--sf-line)" }}>
      <div className="h-4 w-1/2 rounded" style={{ background: "var(--sf-line)" }} />
      <div className="mt-3 h-4 w-3/4 rounded" style={{ background: "var(--sf-line)" }} />
      <div className="mt-3 h-4 w-2/3 rounded" style={{ background: "var(--sf-line)" }} />
    </aside>
  );

  return (
    <div>
      {/* Stepper */}
      <ol className="mt-6 flex flex-wrap items-center gap-2 text-[12.5px]" aria-label="Checkout steps">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <button
              type="button"
              disabled={i > step}
              onClick={() => setStep(i)}
              aria-current={i === step ? "step" : undefined}
              className="flex items-center gap-1.5 font-medium disabled:cursor-default"
              style={{ color: i === step ? "var(--sf-primary)" : i < step ? "var(--sf-text)" : "var(--sf-text-dim)" }}
            >
              <span
                className="flex h-5.5 w-5.5 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  background: i <= step ? "var(--sf-primary)" : "var(--sf-line)",
                  color: i <= step ? "#fff" : "var(--sf-text-dim)",
                  width: "22px",
                  height: "22px",
                }}
                aria-hidden
              >
                {i < step ? "✓" : i + 1}
              </span>
              {label}
            </button>
            {i < STEPS.length - 1 ? <span aria-hidden style={{ color: "var(--sf-line)" }}>—</span> : null}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div
          className="border p-6"
          style={{ borderRadius: "var(--sf-radius)", borderColor: "var(--sf-card-border)", background: "var(--sf-surface)" }}
        >
          {/* Step 1: contact */}
          {step === 0 ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(1);
              }}
              className="flex flex-col gap-4"
            >
              <h2 className="text-lg font-semibold" style={{ color: "var(--sf-text)" }}>Contact information</h2>
              <div>
                <label htmlFor="co-email" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>
                  Email address
                </label>
                <input
                  id="co-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-[14px] outline-none"
                  style={inputStyle}
                  autoComplete="email"
                />
                <p className="mt-1.5 text-[12px]" style={{ color: "var(--sf-text-dim)" }}>
                  Order confirmation and tracking updates go here.
                  {!userEmail ? " You're checking out as a guest." : ""}
                </p>
              </div>
              {!userEmail ? (
                <p className="text-[13px]" style={{ color: "var(--sf-text-dim)" }}>
                  Have an account?{" "}
                  <Link href={`/login?next=/shop/${slug}/checkout`} className="font-medium" style={{ color: "var(--sf-primary)" }}>
                    Sign in
                  </Link>{" "}
                  for saved addresses and payment methods.
                </p>
              ) : null}
              <button
                type="submit"
                className="self-start px-6 py-3 text-[14px] font-semibold text-white"
                style={{ background: "var(--sf-primary)", borderRadius: "var(--sf-btn-radius)" }}
              >
                Continue to address
              </button>
            </form>
          ) : null}

          {/* Step 2: shipping address */}
          {step === 1 ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                nextFromAddress();
              }}
              className="flex flex-col gap-4"
            >
              <h2 className="text-lg font-semibold" style={{ color: "var(--sf-text)" }}>Shipping address</h2>

              {savedAddresses.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>Saved addresses</span>
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() =>
                          setAddress({
                            name: a.name,
                            phone: a.phone ?? "",
                            line1: a.line1,
                            line2: a.line2 ?? "",
                            city: a.city,
                            state: a.state ?? "",
                            postalCode: a.postalCode,
                            country: a.country,
                          })
                        }
                        className="border px-3 py-2 text-left text-[12.5px]"
                        style={{ borderRadius: "8px", borderColor: "var(--sf-line)", color: "var(--sf-text-dim)" }}
                      >
                        <span className="font-semibold" style={{ color: "var(--sf-text)" }}>{a.label}</span>
                        <br />
                        {a.line1}, {a.city}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ad-name" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>Full name</label>
                  <input id="ad-name" required value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} className="w-full px-3.5 py-2.5 text-[14px] outline-none" style={inputStyle} autoComplete="name" />
                </div>
                <div>
                  <label htmlFor="ad-phone" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>Phone (optional)</label>
                  <input id="ad-phone" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} className="w-full px-3.5 py-2.5 text-[14px] outline-none" style={inputStyle} autoComplete="tel" />
                </div>
              </div>
              <div>
                <label htmlFor="ad-line1" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>Address</label>
                <input id="ad-line1" required value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} className="w-full px-3.5 py-2.5 text-[14px] outline-none" style={inputStyle} autoComplete="address-line1" />
              </div>
              <div>
                <label htmlFor="ad-line2" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>Apartment, suite, etc. (optional)</label>
                <input id="ad-line2" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} className="w-full px-3.5 py-2.5 text-[14px] outline-none" style={inputStyle} autoComplete="address-line2" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="ad-city" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>City</label>
                  <input id="ad-city" required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="w-full px-3.5 py-2.5 text-[14px] outline-none" style={inputStyle} autoComplete="address-level2" />
                </div>
                <div>
                  <label htmlFor="ad-state" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>State / region</label>
                  <input id="ad-state" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="w-full px-3.5 py-2.5 text-[14px] outline-none" style={inputStyle} autoComplete="address-level1" />
                </div>
                <div>
                  <label htmlFor="ad-postal" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>Postal code</label>
                  <input id="ad-postal" required value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} className="w-full px-3.5 py-2.5 text-[14px] outline-none" style={inputStyle} autoComplete="postal-code" />
                </div>
              </div>
              <div>
                <label htmlFor="ad-country" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>Country</label>
                <input id="ad-country" required value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} className="w-full px-3.5 py-2.5 text-[14px] outline-none" style={inputStyle} autoComplete="country-name" placeholder="e.g. United States" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(0)} className="border px-5 py-3 text-[14px] font-medium" style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "var(--sf-line)", color: "var(--sf-text)" }}>
                  Back
                </button>
                <button type="submit" disabled={busy} className="px-6 py-3 text-[14px] font-semibold text-white disabled:opacity-50" style={{ background: "var(--sf-primary)", borderRadius: "var(--sf-btn-radius)" }}>
                  {busy ? "Checking rates…" : "Continue to shipping"}
                </button>
              </div>
            </form>
          ) : null}

          {/* Step 3: shipping method */}
          {step === 2 ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold" style={{ color: "var(--sf-text)" }}>Shipping method</h2>
              {quote && quote.shippingOptions.length > 0 ? (
                <div role="radiogroup" aria-label="Shipping options" className="flex flex-col gap-2">
                  {quote.shippingOptions.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={shippingRateId === o.id}
                      onClick={() => chooseShipping(o.id)}
                      className="flex items-center justify-between border px-4 py-3.5 text-left"
                      style={{
                        borderRadius: "10px",
                        borderColor: shippingRateId === o.id ? "var(--sf-primary)" : "var(--sf-line)",
                        background: "var(--sf-bg)",
                      }}
                    >
                      <span>
                        <span className="block text-[14px] font-medium" style={{ color: "var(--sf-text)" }}>
                          {o.name}
                          {o.kind === "PICKUP" ? " (local pickup)" : ""}
                        </span>
                        {o.minDays != null ? (
                          <span className="text-[12.5px]" style={{ color: "var(--sf-text-dim)" }}>
                            {o.minDays}–{o.maxDays ?? o.minDays} business days
                          </span>
                        ) : null}
                      </span>
                      <span className="text-[14px] font-semibold" style={{ color: o.priceCents === 0 ? "#22C55E" : "var(--sf-text)" }}>
                        {o.priceCents === 0 ? (o.freeApplied ? "Free ✨" : "Free") : formatMoney(o.priceCents, quote.currency)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[14px]" style={{ color: "var(--sf-text-dim)" }}>
                  {quote ? "No shipping needed for this order." : "Loading options…"}
                </p>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="border px-5 py-3 text-[14px] font-medium" style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "var(--sf-line)", color: "var(--sf-text)" }}>
                  Back
                </button>
                <button type="button" disabled={busy} onClick={() => setStep(3)} className="px-6 py-3 text-[14px] font-semibold text-white disabled:opacity-50" style={{ background: "var(--sf-primary)", borderRadius: "var(--sf-btn-radius)" }}>
                  Continue to payment
                </button>
              </div>
            </div>
          ) : null}

          {/* Step 4: payment */}
          {step === 3 ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(4);
              }}
              className="flex flex-col gap-4"
            >
              <h2 className="text-lg font-semibold" style={{ color: "var(--sf-text)" }}>Payment</h2>
              <p className="text-[12.5px]" style={{ color: "var(--sf-text-dim)" }}>
                🔒 Payments are processed securely. Card details are never stored on our servers.
              </p>

              <div role="radiogroup" aria-label="Payment method" className="flex flex-wrap gap-2">
                {savedMethods.length > 0 ? (
                  <button type="button" role="radio" aria-checked={payKind === "saved"} onClick={() => setPayKind("saved")} className="border px-4 py-2 text-[13px] font-medium" style={{ borderRadius: "var(--sf-btn-radius)", borderColor: payKind === "saved" ? "var(--sf-primary)" : "var(--sf-line)", color: payKind === "saved" ? "var(--sf-primary)" : "var(--sf-text-dim)" }}>
                    Saved card
                  </button>
                ) : null}
                <button type="button" role="radio" aria-checked={payKind === "card"} onClick={() => setPayKind("card")} className="border px-4 py-2 text-[13px] font-medium" style={{ borderRadius: "var(--sf-btn-radius)", borderColor: payKind === "card" ? "var(--sf-primary)" : "var(--sf-line)", color: payKind === "card" ? "var(--sf-primary)" : "var(--sf-text-dim)" }}>
                  Credit / debit card
                </button>
                <button type="button" role="radio" aria-checked={payKind === "wallet"} onClick={() => setPayKind("wallet")} className="border px-4 py-2 text-[13px] font-medium" style={{ borderRadius: "var(--sf-btn-radius)", borderColor: payKind === "wallet" ? "var(--sf-primary)" : "var(--sf-line)", color: payKind === "wallet" ? "var(--sf-primary)" : "var(--sf-text-dim)" }}>
                  Digital wallet
                </button>
              </div>

              {payKind === "saved" ? (
                <div className="flex flex-col gap-2" role="radiogroup" aria-label="Saved cards">
                  {savedMethods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={savedMethodId === m.id}
                      onClick={() => setSavedMethodId(m.id)}
                      className="flex items-center justify-between border px-4 py-3 text-[13.5px]"
                      style={{ borderRadius: "10px", borderColor: savedMethodId === m.id ? "var(--sf-primary)" : "var(--sf-line)", background: "var(--sf-bg)", color: "var(--sf-text)" }}
                    >
                      <span>{m.cardBrand} •••• {m.cardLast4}</span>
                      <span style={{ color: "var(--sf-text-dim)" }}>
                        {m.expMonth}/{m.expYear}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              {payKind === "card" ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="cc-name" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>Name on card</label>
                    <input id="cc-name" required value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} className="w-full px-3.5 py-2.5 text-[14px] outline-none" style={inputStyle} autoComplete="cc-name" />
                  </div>
                  <div>
                    <label htmlFor="cc-number" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>Card number</label>
                    <input id="cc-number" required inputMode="numeric" placeholder="4242 4242 4242 4242" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} className="w-full px-3.5 py-2.5 text-[14px] outline-none" style={inputStyle} autoComplete="cc-number" />
                    {fieldErrors["payment.card.number"] ? <p className="mt-1 text-[12px]" style={{ color: "#EF4444" }}>{fieldErrors["payment.card.number"]}</p> : null}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="cc-month" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>Exp. month</label>
                      <input id="cc-month" required inputMode="numeric" placeholder="MM" value={card.expMonth} onChange={(e) => setCard({ ...card, expMonth: e.target.value })} className="w-full px-3.5 py-2.5 text-[14px] outline-none" style={inputStyle} autoComplete="cc-exp-month" />
                    </div>
                    <div>
                      <label htmlFor="cc-year" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>Exp. year</label>
                      <input id="cc-year" required inputMode="numeric" placeholder="YYYY" value={card.expYear} onChange={(e) => setCard({ ...card, expYear: e.target.value })} className="w-full px-3.5 py-2.5 text-[14px] outline-none" style={inputStyle} autoComplete="cc-exp-year" />
                    </div>
                    <div>
                      <label htmlFor="cc-cvc" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>CVC</label>
                      <input id="cc-cvc" required inputMode="numeric" placeholder="123" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} className="w-full px-3.5 py-2.5 text-[14px] outline-none" style={inputStyle} autoComplete="cc-csc" />
                    </div>
                  </div>
                  {userEmail ? (
                    <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--sf-text-dim)" }}>
                      <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} />
                      Save this card for faster checkout next time
                    </label>
                  ) : null}
                </div>
              ) : null}

              {payKind === "wallet" ? (
                <p className="border p-4 text-[13.5px]" style={{ borderRadius: "10px", borderColor: "var(--sf-line)", color: "var(--sf-text-dim)" }}>
                  You&apos;ll pay with your digital wallet balance. The payment is authorized when you place the order.
                </p>
              ) : null}

              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(2)} className="border px-5 py-3 text-[14px] font-medium" style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "var(--sf-line)", color: "var(--sf-text)" }}>
                  Back
                </button>
                <button type="submit" className="px-6 py-3 text-[14px] font-semibold text-white" style={{ background: "var(--sf-primary)", borderRadius: "var(--sf-btn-radius)" }}>
                  Review order
                </button>
              </div>
            </form>
          ) : null}

          {/* Step 5: review */}
          {step === 4 ? (
            <div className="flex flex-col gap-5">
              <h2 className="text-lg font-semibold" style={{ color: "var(--sf-text)" }}>Review your order</h2>

              <dl className="space-y-3 text-[13.5px]">
                <div>
                  <dt className="font-semibold" style={{ color: "var(--sf-text)" }}>Contact</dt>
                  <dd style={{ color: "var(--sf-text-dim)" }}>{email}</dd>
                </div>
                <div>
                  <dt className="font-semibold" style={{ color: "var(--sf-text)" }}>Ship to</dt>
                  <dd style={{ color: "var(--sf-text-dim)" }}>
                    {address.name} — {address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}
                    {address.state ? `, ${address.state}` : ""} {address.postalCode}, {address.country}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold" style={{ color: "var(--sf-text)" }}>Shipping method</dt>
                  <dd style={{ color: "var(--sf-text-dim)" }}>{quote?.shippingMethod ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold" style={{ color: "var(--sf-text)" }}>Payment</dt>
                  <dd style={{ color: "var(--sf-text-dim)" }}>
                    {payKind === "saved"
                      ? `Saved card ${savedMethods.find((m) => m.id === savedMethodId)?.cardBrand ?? ""} •••• ${savedMethods.find((m) => m.id === savedMethodId)?.cardLast4 ?? ""}`
                      : payKind === "wallet"
                        ? "Digital wallet"
                        : `Card ending in ${card.number.replace(/\D/g, "").slice(-4) || "—"}`}
                  </dd>
                </div>
              </dl>

              <div>
                <label htmlFor="co-note" className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--sf-text)" }}>
                  Order note (optional)
                </label>
                <textarea id="co-note" rows={2} value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} className="w-full px-3.5 py-2.5 text-[14px] outline-none" style={inputStyle} placeholder="Delivery instructions, gift message…" />
              </div>

              {error ? (
                <p role="alert" className="border px-4 py-3 text-[13.5px] font-medium" style={{ borderRadius: "10px", borderColor: "#EF4444", color: "#EF4444" }}>
                  {error}
                </p>
              ) : null}

              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(3)} className="border px-5 py-3 text-[14px] font-medium" style={{ borderRadius: "var(--sf-btn-radius)", borderColor: "var(--sf-line)", color: "var(--sf-text)" }}>
                  Back
                </button>
                <button
                  type="button"
                  disabled={placing || !quote}
                  onClick={placeOrder}
                  className="flex-1 px-6 py-3 text-[14px] font-semibold text-white disabled:opacity-50"
                  style={{ background: "var(--sf-primary)", borderRadius: "var(--sf-btn-radius)" }}
                >
                  {placing ? "Processing payment…" : quote ? `Place order — ${formatMoney(quote.totalCents, quote.currency)}` : "Place order"}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {summary}
      </div>
    </div>
  );
}
