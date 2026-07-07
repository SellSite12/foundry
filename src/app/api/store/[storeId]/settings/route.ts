import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { updateStoreSchema } from "@/lib/validation/seller";
import { verifyPassword } from "@/lib/auth/password";
import { trackEvent } from "@/lib/analytics";
import { z } from "zod";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  const { store, role } = await requireStoreAccess(storeId);
  return ok({ store, role });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { storeId } = await params;
  const { store, user } = await requireStoreAccess(storeId, "settings");
  const data = await parseBody(req, updateStoreSchema);

  // Completing onboarding is one-way.
  const finishing = data.onboardingDone === true && !store.onboardingDone;

  if (data.customDomain) {
    const taken = await db.store.findFirst({
      where: { customDomain: data.customDomain, id: { not: store.id } },
      select: { id: true },
    });
    if (taken) {
      return fail("That domain is already connected to another store", 409, {
        customDomain: "Already in use",
      });
    }
  }

  const updated = await db.store.update({
    where: { id: store.id },
    data: {
      ...data,
      ...(finishing && { onboardingDone: true, onboardingStep: 5 }),
    },
  });

  if (finishing) {
    await trackEvent("store.onboarding_completed", { userId: user.id, storeId: store.id });
  }

  return ok({ store: updated });
});

const deleteSchema = z.object({ password: z.string().min(1).max(128) });

/** Deletes the store and all of its data. Owner only, password-confirmed. */
export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { storeId } = await params;
  const { store, user, role } = await requireStoreAccess(storeId);
  if (role !== "OWNER") {
    return fail("Only the store owner can delete the store", 403);
  }

  const { password } = await parseBody(req, deleteSchema);
  const dbUser = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(password, dbUser.passwordHash))) {
    return fail("Password is incorrect", 400, { password: "Password is incorrect" });
  }

  await trackEvent("store.deleted", {
    userId: user.id,
    payload: { name: store.name },
  });
  await db.store.delete({ where: { id: store.id } });

  return ok({ deleted: true });
});
