import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

import { getStoreAccess } from "@/lib/seller/access";
import { computeAnalytics, rangeFromKey } from "@/lib/seller/metrics";
import { getAdvancedMetrics } from "@/lib/seller/advanced-metrics";
import { PageHeader } from "@/components/seller/ui";

const AnalyticsDashboard = dynamic(
  () => import("@/components/seller/AnalyticsDashboard").then((m) => m.AnalyticsDashboard),
  { loading: () => <div className="fdy-skeleton h-64 rounded-xl" /> }
);

const AdvancedAnalyticsPanel = dynamic(
  () => import("@/components/seller/AdvancedAnalyticsPanel").then((m) => m.AdvancedAnalyticsPanel),
  { loading: () => <div className="fdy-skeleton h-32 rounded-xl mt-8" /> }
);

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const { storeId } = await params;
  const sp = await searchParams;
  const access = await getStoreAccess(storeId, "analytics");
  if (!access) notFound();

  const rangeKey = sp.range ?? "30d";
  const range = rangeFromKey(rangeKey, sp.from, sp.to);
  const analytics = await computeAnalytics(storeId, range);
  const advanced = await getAdvancedMetrics(storeId, rangeKey as "7d" | "30d" | "90d" | "365d");

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Every chart is computed live from your orders, customers, and visit events."
      />
      <AnalyticsDashboard
        currency={access.store.currency}
        analytics={analytics}
        rangeKey={rangeKey}
        customFrom={sp.from ?? ""}
        customTo={sp.to ?? ""}
      />
      <AdvancedAnalyticsPanel currency={access.store.currency} metrics={advanced} />
    </div>
  );
}
