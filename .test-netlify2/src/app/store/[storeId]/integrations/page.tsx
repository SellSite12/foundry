import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { INTEGRATION_PROVIDERS } from "@/lib/constants";
import { PageHeader } from "@/components/seller/ui";
import { IntegrationsManager } from "@/components/seller/IntegrationsManager";

export const metadata = { title: "Integrations" };

export default async function IntegrationsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "integrations");
  if (!access) notFound();

  const connected = await db.integration.findMany({ where: { storeId } });
  const integrations = INTEGRATION_PROVIDERS.map((p) => {
    const row = connected.find((c) => c.provider === p.id);
    return {
      id: p.id,
      category: p.category,
      label: p.label,
      status: row?.status ?? "DISCONNECTED",
      connected: row?.status === "CONNECTED",
    };
  });

  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect payments, shipping, marketing, CRM, and more. Credentials are encrypted at rest."
      />
      <IntegrationsManager storeId={storeId} integrations={integrations} />
    </div>
  );
}
