import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getEmailSetupStatus } from "@/lib/email/status";
import { PageHeader, Panel } from "@/components/seller/ui";

export const metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");

  const [users, stores, openTickets, email] = await Promise.all([
    db.user.count(),
    db.store.count(),
    db.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } } }),
    Promise.resolve(getEmailSetupStatus()),
  ]);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Platform admin"
        description="Manage users, stores, support tickets, and platform email."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Users">
          <p className="text-2xl font-semibold text-ink">{users}</p>
          <p className="mt-1 text-[13px] text-ink-dim">Registered accounts</p>
        </Panel>
        <Panel title="Stores">
          <p className="text-2xl font-semibold text-ink">{stores}</p>
          <p className="mt-1 text-[13px] text-ink-dim">Seller storefronts</p>
        </Panel>
        <Panel title="Open support tickets">
          <p className="text-2xl font-semibold text-ink">{openTickets}</p>
          <p className="mt-1 text-[13px] text-ink-dim">Needs attention</p>
        </Panel>
        <Panel title="Email delivery">
          <p className="text-[14px] font-medium text-ink">
            {email.configured ? `Active via ${email.provider}` : "Not configured"}
          </p>
          <p className="mt-1 text-[13px] text-ink-dim">From: {email.fromAddress}</p>
        </Panel>
      </div>
    </div>
  );
}
