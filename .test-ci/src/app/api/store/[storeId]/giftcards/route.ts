import { NextRequest } from "next/server";
import { randomBytes } from "crypto";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { giftCardSchema } from "@/lib/validation/seller";

function generateGiftCode(): string {
  // Groups of 4, unambiguous alphabet.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(16);
  let code = "";
  for (let i = 0; i < 16; i++) {
    code += alphabet[bytes[i] % alphabet.length];
    if (i % 4 === 3 && i < 15) code += "-";
  }
  return code;
}

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");

  const giftCards = await db.giftCard.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
  return ok({ giftCards });
});

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");
  const data = await parseBody(req, giftCardSchema);

  const giftCard = await db.giftCard.create({
    data: {
      storeId,
      code: generateGiftCode(),
      initialCents: data.initialCents,
      balanceCents: data.initialCents,
      note: data.note ?? null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });

  return ok({ giftCard }, { status: 201 });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { storeId } = await params;
  await requireStoreAccess(storeId, "marketing");

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Missing gift card id", 400);

  const result = await db.giftCard.deleteMany({ where: { id, storeId } });
  if (result.count === 0) return fail("Gift card not found", 404);
  return ok({ deleted: true });
});
