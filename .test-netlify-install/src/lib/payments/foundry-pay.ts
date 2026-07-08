// Foundry Pay — the built-in development payment processor.
//
// It behaves like a real gateway (authorization rules, decline codes,
// tokenized saved methods) without any external dependency, so the full
// checkout flow can be exercised end-to-end in development. In production,
// setting STRIPE_SECRET_KEY switches checkout to the Stripe adapter.
//
// Test cards (any future expiry, any CVC):
//   4242 4242 4242 4242 → succeeds
//   4000 0000 0000 0002 → card_declined
//   4000 0000 0000 9995 → insufficient_funds
//   Any Luhn-valid card → succeeds

import { randomBytes } from "crypto";

import type { CardInput, ChargeInput, ChargeResult, PaymentProvider, RefundResult } from "@/lib/payments";

function luhnValid(number: string): boolean {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function detectBrand(number: string): string {
  const d = number.replace(/\D/g, "");
  if (d.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  if (/^6(?:011|5)/.test(d)) return "Discover";
  return "Card";
}

function validateCard(card: CardInput): { code: string; message: string } | null {
  const digits = card.number.replace(/\D/g, "");
  if (!luhnValid(digits)) {
    return { code: "invalid_card", message: "The card number is invalid." };
  }
  if (!/^\d{3,4}$/.test(card.cvc)) {
    return { code: "invalid_cvc", message: "The security code is invalid." };
  }
  const now = new Date();
  const expiry = new Date(card.expYear, card.expMonth, 0, 23, 59, 59);
  if (
    card.expMonth < 1 ||
    card.expMonth > 12 ||
    Number.isNaN(expiry.getTime()) ||
    expiry < now
  ) {
    return { code: "expired_card", message: "The card has expired." };
  }
  if (digits === "4000000000000002") {
    return { code: "card_declined", message: "The card was declined." };
  }
  if (digits === "4000000000009995") {
    return { code: "insufficient_funds", message: "The card has insufficient funds." };
  }
  return null;
}

/**
 * In-memory vault mapping saved-method tokens to display data. Card numbers
 * are never stored anywhere — the token itself is the only reference, which
 * is exactly how a hosted-vault provider behaves. Display data (brand/last4)
 * is persisted on the PaymentMethod row at save time.
 */
export function tokenizeCard(card: CardInput): {
  token: string;
  brand: string;
  last4: string;
} {
  const digits = card.number.replace(/\D/g, "");
  return {
    token: `fpm_${randomBytes(16).toString("hex")}`,
    brand: detectBrand(digits),
    last4: digits.slice(-4),
  };
}

export const foundryPayProvider: PaymentProvider = {
  id: "foundry_pay",

  async charge(input: ChargeInput): Promise<ChargeResult> {
    if (input.amountCents <= 0) {
      return { ok: false, failureCode: "invalid_amount", message: "Nothing to charge." };
    }

    if (input.method.kind === "wallet") {
      return {
        ok: true,
        provider: "foundry_pay",
        providerRef: `fpw_${randomBytes(12).toString("hex")}`,
        method: "wallet",
        cardBrand: null,
        cardLast4: null,
        savedMethodRef: null,
      };
    }

    if (input.method.kind === "saved") {
      if (!input.method.providerRef.startsWith("fpm_")) {
        return { ok: false, failureCode: "invalid_method", message: "Unknown payment method." };
      }
      return {
        ok: true,
        provider: "foundry_pay",
        providerRef: `fpt_${randomBytes(12).toString("hex")}`,
        method: "card",
        cardBrand: null, // caller fills display data from the stored method
        cardLast4: null,
        savedMethodRef: null,
      };
    }

    const invalid = validateCard(input.method.card);
    if (invalid) {
      return { ok: false, failureCode: invalid.code, message: invalid.message };
    }

    const digits = input.method.card.number.replace(/\D/g, "");
    const saved = input.method.save ? tokenizeCard(input.method.card) : null;

    return {
      ok: true,
      provider: "foundry_pay",
      providerRef: `fpt_${randomBytes(12).toString("hex")}`,
      method: "card",
      cardBrand: detectBrand(digits),
      cardLast4: digits.slice(-4),
      savedMethodRef: saved?.token ?? null,
    };
  },

  async refund(providerRef: string, amountCents: number): Promise<RefundResult> {
    if (amountCents <= 0) return { ok: false, message: "Invalid refund amount" };
    if (!providerRef.startsWith("fpt_") && !providerRef.startsWith("fpw_")) {
      return { ok: false, message: "Unknown transaction" };
    }
    return { ok: true, providerRef: `fpr_${randomBytes(12).toString("hex")}` };
  },
};
