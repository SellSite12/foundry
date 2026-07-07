import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PageHeader } from "@/components/seller/ui";
import { AiInsightsPanel } from "@/components/seller/AiInsightsPanel";
import { refreshStoreInsights } from "@/lib/ai/insights";

export const metadata = { title: "AI Insights" };

export default async function InsightsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "ai");
  if (!access) notFound();

  let insights = await db.aiInsight.findMany({
    where: { storeId, status: "NEW" },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  if (insights.length === 0) {
    await refreshStoreInsights(storeId);
    insights = await db.aiInsight.findMany({
      where: { storeId, status: "NEW" },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 50,
    });
  }

  return (
    <div>
      <PageHeader
        title="AI Insights"
        description="Data-driven recommendations with explanations — revenue, inventory, retention, and marketing."
      />
      <AiInsightsPanel
        storeId={storeId}
        insights={insights.map((i) => ({
          id: i.id,
          kind: i.kind,
          title: i.title,
          body: i.body,
          explanation: i.explanation,
          priority: i.priority,
          status: i.status,
          createdAt: i.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
