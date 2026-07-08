import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PageHeader } from "@/components/seller/ui";
import { AuditLogViewer } from "@/components/seller/AuditLogViewer";

export const metadata = { title: "Audit logs" };

export default async function AuditPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "audit");
  if (!access) notFound();

  const logs = await db.auditLog.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="Track logins, permission changes, refunds, settings, and API activity."
      />
      <AuditLogViewer
        logs={logs.map((l) => ({
          id: l.id,
          action: l.action,
          userName: l.user?.name ?? null,
          detail: l.detail ? JSON.parse(l.detail) : null,
          ipAddress: l.ipAddress,
          createdAt: l.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
