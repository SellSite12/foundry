import { notFound, redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { requireUser } from "@/lib/auth/session";
import { PageHeader, Panel } from "@/components/seller/ui";

export const metadata = { title: "Workspace" };

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "settings");
  if (!access) notFound();

  const user = await requireUser();
  const [owned, store] = await Promise.all([
    db.workspace.findMany({
      where: { ownerId: user.id },
      include: { stores: true, members: { include: { user: { select: { name: true, email: true } } } } },
    }),
    db.store.findUnique({ where: { id: storeId }, select: { workspaceId: true, name: true } }),
  ]);

  if (access.role !== "OWNER" && access.role !== "ADMIN") {
    redirect(`/store/${storeId}/settings`);
  }

  return (
    <div>
      <PageHeader
        title="Enterprise workspace"
        description="Manage organizations with multiple businesses, departments, and role hierarchies."
      />
      <Panel title="Workspaces">
        {owned.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No workspace yet. Create one via POST /api/workspace to group multiple stores.
          </p>
        ) : (
          <ul className="space-y-4">
            {owned.map((w) => (
              <li key={w.id} className="p-4 border border-[var(--border)] rounded-lg">
                <p className="font-medium">{w.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{w.stores.length} stores · {w.members.length} members</p>
                <ul className="mt-2 text-sm">
                  {w.members.map((m) => (
                    <li key={m.id}>{m.user.name} — {m.role}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
        {store?.workspaceId && (
          <p className="text-sm mt-4">This store belongs to workspace {store.workspaceId}</p>
        )}
      </Panel>
    </div>
  );
}
