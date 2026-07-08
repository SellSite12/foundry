import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PageHeader, Panel } from "@/components/seller/ui";
import { ShippingManager } from "@/components/seller/ShippingManager";

export const metadata = { title: "Shipping" };

export default async function ShippingPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "settings");
  if (!access) notFound();
  const { store } = access;

  const rates = await db.shippingRate.findMany({
    where: { storeId },
    orderBy: { priceCents: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Shipping"
        description="Shipping rates offered at checkout and your ship-from address."
      />

      <div className="mb-5">
        <Panel title="Ship-from address" description="Set in Settings → Contact & address; printed on packing slips.">
          {store.addressLine1 ? (
            <p className="text-[13.5px] text-ink-dim">
              {store.addressLine1}
              {store.addressLine2 && <>, {store.addressLine2}</>}
              {store.city && <>, {store.city}</>}
              {store.state && <>, {store.state}</>}
              {store.postalCode && <> {store.postalCode}</>}
              {store.country && <>, {store.country}</>}
            </p>
          ) : (
            <p className="text-[13px] text-ink-faint">
              No address set yet — add one in store settings so it appears on packing slips.
            </p>
          )}
        </Panel>
      </div>

      <ShippingManager
        storeId={storeId}
        currency={store.currency}
        rates={rates.map((r) => ({
          id: r.id,
          name: r.name,
          kind: r.kind,
          region: r.region,
          countries: r.countries,
          priceCents: r.priceCents,
          freeAboveCents: r.freeAboveCents,
          minDays: r.minDays,
          maxDays: r.maxDays,
          active: r.active,
        }))}
      />
    </div>
  );
}
