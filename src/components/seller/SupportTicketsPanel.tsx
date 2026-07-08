"use client";

import { useCallback, useEffect, useState } from "react";
import { LifeBuoy, MessageSquare } from "lucide-react";

import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { StatusBadge } from "@/components/seller/ui";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  lastMessage: string | null;
};

type Message = {
  id: string;
  body: string;
  isStaff: boolean;
  authorName: string;
  createdAt: string;
};

export function SupportTicketsPanel({ storeId }: { storeId: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    const res = await api<{ tickets: Ticket[] }>(`/api/store/${storeId}/support/tickets`);
    setLoading(false);
    if (res.ok) setTickets(res.data.tickets);
  }, [storeId]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  async function loadTicket(id: string) {
    setSelected(id);
    const res = await api<{ ticket: { messages: Message[] } }>(`/api/admin/support/${id}`);
    if (res.ok) setMessages(res.data.ticket.messages);
  }

  async function submitTicket() {
    if (!subject.trim() || !body.trim()) return;
    setBusy(true);
    setError(null);
    const res = await api(`/api/store/${storeId}/support/tickets`, {
      method: "POST",
      body: { subject: subject.trim(), body: body.trim() },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSubject("");
    setBody("");
    setShowForm(false);
    loadTickets();
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setBusy(true);
    const res = await api(`/api/admin/support/${selected}`, {
      method: "POST",
      body: { body: reply.trim() },
    });
    setBusy(false);
    if (res.ok) {
      setReply("");
      loadTicket(selected);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <LifeBuoy size={16} className="text-copper" />
          Contact Foundry support
        </div>
        <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "New ticket"}
        </Button>
      </div>

      <p className="mb-4 text-[13px] text-ink-dim">
        Open a ticket and our team will reply by email. Most shops use this for billing, technical issues, or account help.
      </p>

      {error ? <div className="mb-4"><Alert kind="error">{error}</Alert></div> : null}

      {showForm ? (
        <div className="mb-5 rounded-xl border border-line bg-base p-4">
          <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Need help with…" />
          <div className="mt-3">
            <label className="mb-1 block text-[12.5px] font-medium text-ink-dim">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none"
              placeholder="Describe what you need help with…"
            />
          </div>
          <Button className="mt-3" loading={busy} onClick={submitTicket}>
            Submit ticket
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">Your tickets</h3>
          {loading ? (
            <div className="h-20 animate-pulse rounded-xl border border-line bg-base" />
          ) : tickets.length === 0 ? (
            <p className="text-[13px] text-ink-dim">No tickets yet.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => loadTicket(t.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    selected === t.id ? "border-copper bg-copper-soft" : "border-line bg-base hover:border-line-strong"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-ink">{t.subject}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  {t.lastMessage ? (
                    <p className="mt-1 truncate text-[12px] text-ink-faint">{t.lastMessage}</p>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>

        {selected ? (
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
              <MessageSquare size={12} /> Conversation
            </h3>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-line bg-base p-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-lg px-3 py-2 text-[13px] ${
                    m.isStaff ? "bg-copper-soft text-ink" : "bg-surface text-ink-dim"
                  }`}
                >
                  <div className="mb-1 text-[11px] font-medium text-ink-faint">{m.authorName}</div>
                  {m.body}
                </div>
              ))}
            </div>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              placeholder="Add a reply…"
              className="mt-2 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none"
            />
            <Button className="!px-3 !py-1.5 text-[12px]" loading={busy} onClick={sendReply}>
              Send reply
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
