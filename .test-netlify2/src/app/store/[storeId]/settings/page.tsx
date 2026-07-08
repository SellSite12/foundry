import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PageHeader, Panel } from "@/components/seller/ui";
import { StoreSettings } from "@/components/seller/StoreSettings";
import { TaxRulesManager } from "@/components/seller/TaxRulesManager";

export const metadata = { title: "Store settings" };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "settings");
  if (!access) notFound();
  const { store, role } = access;

  const taxRules = await db.taxRule.findMany({
    where: { storeId },
    orderBy: [{ country: "asc" }, { state: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Store profile, contact, tax, locale, branding, and the danger zone."
      />
      <StoreSettings
        isOwner={role === "OWNER"}
        store={{
          id: store.id,
          name: store.name,
          description: store.description ?? "",
          industry: store.industry ?? "",
          website: store.website ?? "",
          phone: store.phone ?? "",
          businessEmail: store.businessEmail ?? "",
          addressLine1: store.addressLine1 ?? "",
          addressLine2: store.addressLine2 ?? "",
          city: store.city ?? "",
          state: store.state ?? "",
          postalCode: store.postalCode ?? "",
          country: store.country ?? "",
          taxId: store.taxId ?? "",
          taxRate: String(store.taxRate),
          taxInclusive: store.taxInclusive,
          timezone: store.timezone,
          currency: store.currency,
          brandColor: store.brandColor,
          logo: store.logo ?? "",
          status: store.status,
        }}
      />

      <div className="mt-6">
        <Panel
          title="Regional tax rules"
          description="Override the default tax rate per country or state at checkout."
        >
          <TaxRulesManager
            storeId={storeId}
            initialRules={taxRules.map((r) => ({
              id: r.id,
              name: r.name,
              country: r.country,
              state: r.state,
              rate: r.rate,
              active: r.active,
            }))}
          />
        </Panel>
      </div>
    </div>
  );
}
