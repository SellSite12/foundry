import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { getUserStores } from "@/lib/seller/access";
import { createStoreSchema } from "@/lib/validation/seller";
import { uniqueSlug } from "@/lib/seller/slug";
import { PLAN_DEFS } from "@/lib/plans";
import { trackEvent } from "@/lib/analytics";
import { createNotification } from "@/lib/notifications";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const stores = await getUserStores(user.id);
  return ok({ stores });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const data = await parseBody(req, createStoreSchema);

  // Enforce plan store limits (highest active plan across user subscriptions).
  const ownedCount = await db.store.count({ where: { ownerId: user.id } });
  const subs = await db.subscription.findMany({
    where: { userId: user.id, status: "ACTIVE" },
  });
  const bestPlan =
    subs.find((s) => s.plan === "SCALE")?.plan ??
    subs.find((s) => s.plan === "GROWTH")?.plan ??
    "STARTER";
  const limit = PLAN_DEFS[bestPlan as keyof typeof PLAN_DEFS].limits.stores;
  if (limit !== null && ownedCount >= limit) {
    return fail(
      `Your ${PLAN_DEFS[bestPlan as keyof typeof PLAN_DEFS].name} plan allows ${limit} store${limit === 1 ? "" : "s"}. Upgrade to add more.`,
      403
    );
  }

  const store = await db.store.create({
    data: {
      ownerId: user.id,
      name: data.name,
      slug: uniqueSlug(data.name),
      description: data.description ?? null,
      industry: data.industry ?? null,
      onboardingStep: 2,
    },
  });

  // Every store gets a platform subscription row (Starter by default).
  await db.subscription.create({
    data: { userId: user.id, storeId: store.id, plan: "STARTER", status: "ACTIVE" },
  });

  await trackEvent("store.created", { userId: user.id, storeId: store.id });
  await createNotification({
    userId: user.id,
    type: "SUCCESS",
    title: `${store.name} created`,
    body: "Finish onboarding to open your seller dashboard.",
    href: `/onboarding/${store.id}`,
  });

  return ok({ store }, { status: 201 });
});
