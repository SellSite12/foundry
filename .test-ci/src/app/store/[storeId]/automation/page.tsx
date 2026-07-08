import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PageHeader } from "@/components/seller/ui";
import { AutomationManager } from "@/components/seller/AutomationManager";

export const metadata = { title: "Automation" };

export default async function AutomationPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "marketing");
  if (!access) notFound();

  const automations = await db.automationRule.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Automation"
        description="Event-driven rules with notifications, emails, webhooks, discounts, AI content, and conditional branching."
      />
      <AutomationManager
        storeId={storeId}
        automations={automations.map((a) => ({
          id: a.id,
          name: a.name,
          trigger: a.trigger,
          action: a.action,
          enabled: a.enabled,
          runCount: a.runCount,
          createdAt: a.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
