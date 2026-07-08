import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PLAN_DEFS } from "@/lib/plans";
import { PageHeader } from "@/components/seller/ui";
import { BillingManager } from "@/components/seller/BillingManager";

export const metadata = { title: "Billing" };

export default async function BillingPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "billing");
  if (!access) notFound();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [subscription, products, ordersThisMonth, seats, storage, history] =
    await Promise.all([
      db.subscription.findFirst({
        where: { storeId },
        orderBy: { createdAt: "desc" },
      }),
      db.product.count({ where: { storeId } }),
      db.order.count({ where: { storeId, createdAt: { gte: monthStart } } }),
      db.teamMember.count({ where: { storeId, status: { not: "REMOVED" } } }),
      db.mediaFile.aggregate({ where: { storeId }, _sum: { sizeBytes: true } }),
      db.analyticsEvent.findMany({
        where: { storeId, type: { in: ["billing.plan_changed", "billing.canceled"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Your plan, live usage, and billing history. Card payments for paid plans connect in Phase 4."
      />
      <BillingManager
        storeId={storeId}
        isOwner={access.role === "OWNER"}
        subscription={
          subscription
            ? {
                plan: subscription.plan,
                status: subscription.status,
                currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
                canceledAt: subscription.canceledAt?.toISOString() ?? null,
              }
            : null
        }
        usage={{
          products,
          ordersThisMonth,
          teamSeats: seats + 1,
          storageBytes: storage._sum.sizeBytes ?? 0,
        }}
        plans={Object.values(PLAN_DEFS)}
        history={history.map((h) => ({
          id: h.id,
          type: h.type,
          payload: h.payload,
          createdAt: h.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
