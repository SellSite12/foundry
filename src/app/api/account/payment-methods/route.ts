import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { savePaymentMethodSchema } from "@/lib/validation/shop";
import { tokenizeCard } from "@/lib/payments/foundry-pay";
import { auditLog } from "@/lib/audit";

/** Saved payment methods. Only provider tokens + display data — never card numbers. */
export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const methods = await db.paymentMethod.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      provider: true,
      method: true,
      cardBrand: true,
      cardLast4: true,
      expMonth: true,
      expYear: true,
      isDefault: true,
      createdAt: true,
    },
  });
  return ok({ methods });
});

/** Tokenizes and saves a card. The number/CVC are used transiently only. */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const data = await parseBody(req, savePaymentMethodSchema);

  const now = new Date();
  const expiry = new Date(data.card.expYear, data.card.expMonth, 0, 23, 59, 59);
  if (expiry < now) return fail("This card has expired.", 400, { card: "Expired" });

  const tokenized = tokenizeCard(data.card);

  const count = await db.paymentMethod.count({ where: { userId: user.id } });
  const makeDefault = data.isDefault || count === 0;
  if (makeDefault) {
    await db.paymentMethod.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }

  const method = await db.paymentMethod.create({
    data: {
      userId: user.id,
      provider: "foundry_pay",
      providerRef: tokenized.token,
      method: "card",
      cardBrand: tokenized.brand,
      cardLast4: tokenized.last4,
      expMonth: data.card.expMonth,
      expYear: data.card.expYear,
      isDefault: makeDefault,
    },
    select: {
      id: true,
      cardBrand: true,
      cardLast4: true,
      expMonth: true,
      expYear: true,
      isDefault: true,
    },
  });

  await auditLog({ action: "payment_method.saved", userId: user.id });
  return ok({ method }, { status: 201 });
});

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing method id", 400);

  const existing = await db.paymentMethod.findFirst({ where: { id, userId: user.id } });
  if (!existing) return fail("Payment method not found", 404);

  await db.paymentMethod.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  await db.paymentMethod.update({ where: { id: existing.id }, data: { isDefault: true } });
  return ok({ updated: true });
});

export const DELETE = withErrorHandling(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing method id", 400);

  const result = await db.paymentMethod.deleteMany({ where: { id, userId: user.id } });
  if (result.count === 0) return fail("Payment method not found", 404);

  await auditLog({ action: "payment_method.removed", userId: user.id });
  return ok({ deleted: true });
});
