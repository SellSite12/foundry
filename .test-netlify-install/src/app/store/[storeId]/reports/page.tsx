import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PageHeader } from "@/components/seller/ui";
import { ReportsManager } from "@/components/seller/ReportsManager";

export const metadata = { title: "Reports" };

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "reports");
  if (!access) notFound();

  const reports = await db.report.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    include: { runs: { orderBy: { createdAt: "desc" }, take: 3 } },
  });

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and schedule downloadable CSV reports from live store data."
      />
      <ReportsManager
        storeId={storeId}
        reports={reports.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          format: r.format,
          schedule: r.schedule,
          lastRunAt: r.lastRunAt?.toISOString() ?? null,
          runs: r.runs.map((run) => ({
            id: run.id,
            status: run.status,
            fileUrl: run.fileUrl,
            rowCount: run.rowCount,
          })),
        }))}
      />
    </div>
  );
}
