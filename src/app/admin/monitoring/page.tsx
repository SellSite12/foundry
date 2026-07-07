import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getQueueStats } from "@/lib/jobs/queue";
import { PageHeader, Panel } from "@/components/seller/ui";

export const metadata = { title: "Platform monitoring" };

export default async function AdminMonitoringPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");

  const [users, stores, orders, queue, apiLogs, failedJobs] = await Promise.all([
    db.user.count(),
    db.store.count(),
    db.order.count(),
    getQueueStats(),
    db.apiRequestLog.count({ where: { createdAt: { gte: new Date(Date.now() - 86_400_000) } } }),
    db.backgroundJob.count({ where: { status: "FAILED" } }),
  ]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <PageHeader
        title="Platform monitoring"
        description="Application health, queue status, and API performance."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Application">
          <ul className="text-sm space-y-1">
            <li>Users: {users}</li>
            <li>Stores: {stores}</li>
            <li>Orders: {orders}</li>
            <li>Status: healthy</li>
          </ul>
        </Panel>
        <Panel title="Job queue">
          <ul className="text-sm space-y-1">
            <li>Pending: {queue.pending}</li>
            <li>Running: {queue.running}</li>
            <li>Failed: {queue.failed}</li>
            <li>Completed (24h): {queue.completedLast24h}</li>
          </ul>
        </Panel>
        <Panel title="API (24h)">
          <ul className="text-sm space-y-1">
            <li>Requests: {apiLogs}</li>
            <li>Failed jobs: {failedJobs}</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
