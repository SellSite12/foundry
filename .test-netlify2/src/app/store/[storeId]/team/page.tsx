import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PageHeader } from "@/components/seller/ui";
import { TeamManager } from "@/components/seller/TeamManager";

export const metadata = { title: "Team members" };

export default async function TeamPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "team");
  if (!access) notFound();

  const [members, owner] = await Promise.all([
    db.teamMember.findMany({
      where: { storeId, status: { not: "REMOVED" } },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true } } },
    }),
    db.user.findUnique({
      where: { id: access.store.ownerId },
      select: { name: true, email: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Team members"
        description="Invite staff with role-based access. Existing Foundry accounts join instantly; others get an email invite."
      />
      <TeamManager
        storeId={storeId}
        canManage={access.role === "OWNER" || access.role === "ADMIN"}
        owner={owner ? { name: owner.name, email: owner.email } : null}
        members={members.map((m) => ({
          id: m.id,
          email: m.email,
          name: m.user?.name ?? null,
          role: m.role,
          status: m.status,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
