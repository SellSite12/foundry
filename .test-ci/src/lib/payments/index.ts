// Provider-agnostic payment processing.
//
// The active provider is resolved at runtime: when STRIPE_SECRET_KEY is
// configured the Stripe adapter takes over; otherwise Foundry Pay (the
// built-in development processor) handles charges. Both implement the same
// interface, so checkout code never branches on the provider.
//
// Card data policy: raw card numbers and CVCs are used transiently to
// tokenize/authorize and are NEVER persisted. Only the provider token,
// brand, and last4 are stored.

import { foundryPayProvider } from "@/lib/payments/foundry-pay";
import { stripeProvider } from "@/lib/payments/stripe";

export type CardInput = {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  name: string;
};

export type ChargeMethod =
  | { kind: "card"; card: CardInput; save?: boolean }
  | { kind: "saved"; providerRef: string }
  | { kind: "wallet" };

export type ChargeInput = {
  amountCents: number;
  currency: string;
  description: string;
  method: ChargeMethod;
};

export type ChargeSuccess = {
  ok: true;
  provider: string;
  providerRef: string; // transaction id
  method: "card" | "wallet";
  cardBrand: string | null;
  cardLast4: string | null;
  /** present when method.save was requested — safe to persist */
  savedMethodRef: string | null;
};

export type ChargeFailure = {
  ok: false;
  failureCode: string; // card_declined | insufficient_funds | expired_card | invalid_card | ...
  message: string;
};

export type ChargeResult = ChargeSuccess | ChargeFailure;

export type RefundResult =
  | { ok: true; providerRef: string }
  | { ok: false; message: string };

export interface PaymentProvider {
  id: string;
  charge(input: ChargeInput): Promise<ChargeResult>;
  refund(providerRef: string, amountCents: number): Promise<RefundResult>;
}

export function getPaymentProvider(): PaymentProvider {
  if (process.env.STRIPE_SECRET_KEY) return stripeProvider;
  return foundryPayProvider;
}

/** Basic fraud-detection foundation: flags orders worth a manual look. */
export function assessRisk(input: {
  amountCents: number;
  isGuest: boolean;
  itemCount: number;
}): "low" | "elevated" | "high" {
  let score = 0;
  if (input.amountCents >= 100_000) score += 1; // $1,000+
  if (input.amountCents >= 500_000) score += 2; // $5,000+
  if (input.isGuest && input.amountCents >= 50_000) score += 1;
  if (input.itemCount >= 25) score += 1;
  return score >= 3 ? "high" : score >= 1 ? "elevated" : "low";
}
