// Stripe adapter — activates when STRIPE_SECRET_KEY is set.
//
// Uses the Stripe REST API directly (no SDK dependency) so checkout works
// in production as soon as the secret key is configured. Card data is
// tokenized client-side in a full Stripe.js integration; this adapter
// accepts PaymentMethod IDs for server-side confirmation.
//
// For development without Stripe, Foundry Pay handles charges instead.

import type { ChargeInput, ChargeResult, PaymentProvider, RefundResult } from "@/lib/payments";

const STRIPE_API = "https://api.stripe.com/v1";

function secret(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

async function stripePost<T>(path: string, body: Record<string, string>): Promise<T> {
  const key = secret();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");

  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });

  const json = (await res.json()) as T & { error?: { code?: string; message?: string } };
  if (!res.ok) {
    const err = json.error;
    throw new Error(err?.message ?? `Stripe error (${res.status})`);
  }
  return json;
}

type PaymentIntent = {
  id: string;
  status: string;
  latest_charge?: string;
  charges?: { data: { payment_method_details?: { card?: { brand?: string; last4?: string } } }[] };
  payment_method?: string;
};

type Refund = { id: string };

export const stripeProvider: PaymentProvider = {
  id: "stripe",

  async charge(input: ChargeInput): Promise<ChargeResult> {
    if (!secret()) {
      return {
        ok: false,
        failureCode: "provider_unavailable",
        message: "Stripe is not configured. Set STRIPE_SECRET_KEY or use Foundry Pay in development.",
      };
    }

    try {
      if (input.method.kind === "wallet") {
        return {
          ok: false,
          failureCode: "wallet_unsupported",
          message: "Digital wallets require Stripe.js on the client. Use card payment for now.",
        };
      }

      let paymentMethodId: string;

      if (input.method.kind === "saved") {
        paymentMethodId = input.method.providerRef;
      } else {
        // Create a PaymentMethod from raw card data (server-side tokenization).
        // In production, prefer Stripe.js Elements so card data never hits your server.
        const pm = await stripePost<{ id: string }>("/payment_methods", {
          type: "card",
          "card[number]": input.method.card.number.replace(/\D/g, ""),
          "card[exp_month]": String(input.method.card.expMonth),
          "card[exp_year]": String(input.method.card.expYear),
          "card[cvc]": input.method.card.cvc,
          "billing_details[name]": input.method.card.name,
        });
        paymentMethodId = pm.id;
      }

      const intent = await stripePost<PaymentIntent>("/payment_intents", {
        amount: String(input.amountCents),
        currency: input.currency.toLowerCase(),
        payment_method: paymentMethodId,
        confirm: "true",
        description: input.description,
        "automatic_payment_methods[enabled]": "false",
      });

      if (intent.status !== "succeeded") {
        return {
          ok: false,
          failureCode: intent.status,
          message: `Payment was not completed (${intent.status}).`,
        };
      }

      const card = intent.charges?.data?.[0]?.payment_method_details?.card;
      return {
        ok: true,
        provider: "stripe",
        providerRef: intent.id,
        method: "card",
        cardBrand: card?.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : null,
        cardLast4: card?.last4 ?? null,
        savedMethodRef: input.method.kind === "card" && input.method.save ? paymentMethodId : null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Stripe charge failed";
      const code = message.toLowerCase().includes("declined")
        ? "card_declined"
        : message.toLowerCase().includes("insufficient")
          ? "insufficient_funds"
          : "processing_error";
      return { ok: false, failureCode: code, message };
    }
  },

  async refund(providerRef: string, amountCents: number): Promise<RefundResult> {
    if (!secret()) {
      return { ok: false, message: "Stripe is not configured." };
    }
    try {
      const refund = await stripePost<Refund>("/refunds", {
        payment_intent: providerRef,
        amount: String(amountCents),
      });
      return { ok: true, providerRef: refund.id };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Stripe refund failed",
      };
    }
  },
};
