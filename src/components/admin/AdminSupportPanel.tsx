"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { api } from "@/lib/client/api";
import { PageHeader, Panel, StatusBadge } from "@/components/seller/ui";

type TicketRow = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  user: { name: string; email: string };
  store: { name: string; slug: string } | null;
  lastMessage: string | null;
  updatedAt: string;
};

export function AdminSupportPanel() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api<{ tickets: TicketRow[] }>("/api/admin/support");
    setLoading(false);
    if (res.ok) setTickets(res.data.tickets);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Support tickets"
        description="Merchant requests — reply from the ticket detail page."
      />
      <Panel title="Open & recent">
        {loading ? (
          <p className="text-[13px] text-ink-faint">Loading…</p>
        ) : tickets.length === 0 ? (
          <p className="text-[13px] text-ink-dim">No tickets yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {tickets.map((t) => (
              <Link
                key={t.id}
                href={`/admin/support/${t.id}`}
                className="rounded-xl border border-line bg-base px-4 py-3 transition-colors hover:border-line-strong"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[14px] font-medium text-ink">{t.subject}</span>
                  <div className="flex gap-1.5">
                    <StatusBadge status={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </div>
                <p className="mt-1 text-[12px] text-ink-faint">
                  {t.user.name} ({t.user.email})
                  {t.store ? ` · ${t.store.name}` : ""}
                </p>
                {t.lastMessage ? (
                  <p className="mt-1 truncate text-[12px] text-ink-dim">{t.lastMessage}</p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
