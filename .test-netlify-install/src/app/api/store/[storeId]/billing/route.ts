import { NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { ok, fail, parseBody, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { requireStoreAccess } from "@/lib/seller/access";
import { changePlanSchema } from "@/lib/validation/seller";
import { PLAN_DEFS } from "@/lib/plans";
import { trackEvent } from "@/lib/analytics";
import { createNotification } from "@/lib/notifications";

async function getUsage(storeId: string) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [products, ordersThisMonth, seats, storage] = await Promise.all([
    db.product.count({ where: { storeId } }),
    db.order.count({ where: { storeId, createdAt: { gte: monthStart } } }),
    db.teamMember.count({ where: { storeId, status: { not: "REMOVED" } } }),
    db.mediaFile.aggregate({ where: { storeId }, _sum: { sizeBytes: true } }),
  ]);

  return {
    products,
    ordersThisMonth,
    teamSeats: seats + 1, // owner's implicit seat
    storageBytes: storage._sum.sizeBytes ?? 0,
  };
}

export const GET = withErrorHandling(async (_req, { params }) => {
  const { storeId } = await params;
  await requireStoreAccess(storeId, "billing");

  const subscription = await db.subscription.findFirst({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });

  const planChanges = await db.analyticsEvent.findMany({
    where: { storeId, type: { in: ["billing.plan_changed", "billing.canceled"] } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return ok({
    subscription,
    usage: await getUsage(storeId),
    plans: PLAN_DEFS,
    history: planChanges,
  });
});

const actionSchema = z.union([
  changePlanSchema.extend({ action: z.literal("change_plan") }),
  z.object({ action: z.literal("cancel") }),
  z.object({ action: z.literal("resume") }),
]);

export const POST = withErrorHandling(async (req: NextRequest, { params }) => {
  assertSameOrigin(req);
  const { storeId } = await params;
  const { store, user, role } = await requireStoreAccess(storeId, "billing");
  if (role !== "OWNER") {
    return fail("Only the store owner can change billing", 403);
  }

  const data = await parseBody(req, actionSchema);

  const subscription = await db.subscription.findFirst({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
  if (!subscription) return fail("No subscription found for this store", 404);

  if (data.action === "change_plan") {
    if (subscription.plan === data.plan && subscription.status === "ACTIVE") {
      return fail("You're already on this plan", 400);
    }
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const updated = await db.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: data.plan,
        status: "ACTIVE",
        canceledAt: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      },
    });

    await trackEvent("billing.plan_changed", {
      userId: user.id,
      storeId,
      payload: { from: subscription.plan, to: data.plan },
    });
    await createNotification({
      userId: store.ownerId,
      type: "PAYMENT",
      title: `Plan changed to ${PLAN_DEFS[data.plan].name}`,
      body: "Payment collection for paid plans arrives with Phase 4 checkout.",
      href: `/store/${storeId}/billing`,
    });

    return ok({ subscription: updated });
  }

  if (data.action === "cancel") {
    const updated = await db.subscription.update({
      where: { id: subscription.id },
      data: { status: "CANCELED", canceledAt: new Date() },
    });
    await trackEvent("billing.canceled", {
      userId: user.id,
      storeId,
      payload: { plan: subscription.plan },
    });
    return ok({ subscription: updated });
  }

  // resume
  const updated = await db.subscription.update({
    where: { id: subscription.id },
    data: { status: "ACTIVE", canceledAt: null },
  });
  return ok({ subscription: updated });
});
