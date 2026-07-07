import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PageHeader } from "@/components/seller/ui";
import { DiscountsManager } from "@/components/seller/DiscountsManager";

export const metadata = { title: "Discounts" };

export default async function DiscountsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "marketing");
  if (!access) notFound();

  const discounts = await db.discount.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Discounts"
        description="Codes, automatic discounts, and bundles — applied at storefront checkout and on manual orders."
      />
      <DiscountsManager
        storeId={storeId}
        currency={access.store.currency}
        discounts={discounts.map((d) => ({
          id: d.id,
          kind: d.kind,
          code: d.code,
          title: d.title,
          type: d.type,
          value: d.value,
          minSubtotalCents: d.minSubtotalCents,
          usageLimit: d.usageLimit,
          usedCount: d.usedCount,
          status: d.status,
          startsAt: d.startsAt?.toISOString() ?? null,
          endsAt: d.endsAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
