"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";
import { PageHeader, Panel, StatusBadge } from "@/components/seller/ui";

type Message = {
  id: string;
  body: string;
  isStaff: boolean;
  authorName: string;
  createdAt: string;
};

type Ticket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  user: { name: string; email: string };
  store: { name: string } | null;
  messages: Message[];
};

export function AdminTicketDetail({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await api<{ ticket: Ticket }>(`/api/admin/support/${ticketId}`);
    if (res.ok) setTicket(res.data.ticket);
  }, [ticketId]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendReply() {
    if (!reply.trim()) return;
    setBusy(true);
    const res = await api(`/api/admin/support/${ticketId}`, {
      method: "POST",
      body: { body: reply.trim() },
    });
    setBusy(false);
    if (res.ok) {
      setReply("");
      load();
    }
  }

  async function setStatus(status: string) {
    setBusy(true);
    await api(`/api/admin/support/${ticketId}`, { method: "PATCH", body: { status } });
    setBusy(false);
    load();
    router.refresh();
  }

  if (!ticket) return <p className="text-[13px] text-ink-faint">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={ticket.subject}
        description={`${ticket.user.name} · ${ticket.user.email}${ticket.store ? ` · ${ticket.store.name}` : ""}`}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge status={ticket.status} />
        <StatusBadge status={ticket.priority} />
        <Button className="!px-3 !py-1 text-[11px]" variant="secondary" onClick={() => setStatus("IN_PROGRESS")}>In progress</Button>
        <Button className="!px-3 !py-1 text-[11px]" variant="secondary" onClick={() => setStatus("RESOLVED")}>Resolve</Button>
        <Button className="!px-3 !py-1 text-[11px]" variant="secondary" onClick={() => setStatus("CLOSED")}>Close</Button>
      </div>
      <Panel title="Conversation">
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {ticket.messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg px-3 py-2 text-[13px] ${m.isStaff ? "bg-copper-soft text-ink" : "bg-base text-ink-dim"}`}
            >
              <div className="mb-1 text-[11px] font-medium text-ink-faint">{m.authorName}</div>
              {m.body}
            </div>
          ))}
        </div>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={4}
          placeholder="Reply to merchant…"
          className="mt-4 w-full rounded-xl border border-line bg-base px-3.5 py-2.5 text-[14px] text-ink outline-none"
        />
        <Button className="mt-3" loading={busy} onClick={sendReply}>Send reply</Button>
      </Panel>
    </div>
  );
}
