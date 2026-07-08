"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, MessageSquare, Send, Archive } from "lucide-react";

import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { EmptyState, StatusBadge, Modal } from "@/components/seller/ui";

type Message = {
  id: string;
  from: string;
  authorName: string | null;
  body: string;
  createdAt: string;
};
type Conversation = {
  id: string;
  subject: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  updatedAt: string;
  messages: Message[];
};

export function InboxManager({
  storeId,
  customers,
  conversations,
}: {
  storeId: string;
  customers: { id: string; name: string; email: string }[];
  conversations: Conversation[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", customerId: "", body: "" });
  const [error, setError] = useState<string | null>(null);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !reply.trim()) return;
    setSending(true);
    const res = await api(`/api/store/${storeId}/inbox/${selected.id}`, {
      method: "POST",
      body: { body: reply.trim() },
    });
    setSending(false);
    if (res.ok) {
      setReply("");
      router.refresh();
    }
  }

  async function toggleStatus() {
    if (!selected) return;
    await api(`/api/store/${storeId}/inbox/${selected.id}`, {
      method: "PATCH",
      body: { status: selected.status === "OPEN" ? "CLOSED" : "OPEN" },
    });
    router.refresh();
  }

  async function startConversation(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await api<{ conversation: { id: string } }>(`/api/store/${storeId}/inbox`, {
      method: "POST",
      body: {
        subject: form.subject,
        customerId: form.customerId || null,
        body: form.body,
      },
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setNewOpen(false);
    setForm({ subject: "", customerId: "", body: "" });
    setSelectedId(res.data.conversation.id);
    router.refresh();
  }

  if (conversations.length === 0) {
    return (
      <>
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setNewOpen(true)}>
            <Plus size={14} /> New conversation
          </Button>
        </div>
        <EmptyState
          icon={<MessageSquare size={20} />}
          title="Inbox is empty"
          body="Start a conversation with a customer, or wait for storefront messages in Phase 4."
          action={
            <Button onClick={() => setNewOpen(true)}>
              <Plus size={14} /> Start a conversation
            </Button>
          }
        />
        <NewConversationModal
          open={newOpen}
          onClose={() => setNewOpen(false)}
          customers={customers}
          form={form}
          setForm={setForm}
          onSubmit={startConversation}
          error={error}
        />
      </>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setNewOpen(true)}>
          <Plus size={14} /> New conversation
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* conversation list */}
        <div className="flex max-h-[65vh] flex-col gap-1.5 overflow-y-auto rounded-2xl border border-line bg-surface p-2">
          {conversations.map((c) => {
            const last = c.messages[c.messages.length - 1];
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`rounded-xl px-3.5 py-3 text-left transition-colors ${
                  selectedId === c.id ? "bg-copper-soft" : "hover:bg-hover"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-medium text-ink">{c.subject}</span>
                  <StatusBadge status={c.status} />
                </div>
                <div className="mt-0.5 truncate text-[11.5px] text-ink-faint">
                  {c.customerName ?? "No customer"} · {last?.body ?? ""}
                </div>
              </button>
            );
          })}
        </div>

        {/* thread */}
        <div className="flex max-h-[65vh] flex-col rounded-2xl border border-line bg-surface lg:col-span-2">
          {selected ? (
            <>
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <div>
                  <div className="text-[14px] font-semibold text-ink">{selected.subject}</div>
                  <div className="text-[11.5px] text-ink-faint">
                    {selected.customerName ?? "No customer linked"}
                    {selected.customerEmail && ` · ${selected.customerEmail}`}
                  </div>
                </div>
                <button
                  onClick={toggleStatus}
                  className="flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-[11.5px] text-ink-dim hover:text-ink"
                >
                  <Archive size={12} />
                  {selected.status === "OPEN" ? "Close" : "Reopen"}
                </button>
              </div>

              <div className="fdy-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto p-5">
                {selected.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] ${
                      m.from === "STORE"
                        ? "self-end bg-copper-soft text-ink"
                        : "self-start bg-base2 text-ink-dim"
                    }`}
                  >
                    <div className="mb-0.5 text-[10.5px] font-semibold text-ink-faint">
                      {m.from === "STORE" ? (m.authorName ?? "You") : (m.authorName ?? "Customer")} ·{" "}
                      {new Date(m.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                    {m.body}
                  </div>
                ))}
              </div>

              <form onSubmit={sendReply} className="flex gap-2 border-t border-line p-4">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write a reply…"
                  className="flex-1 rounded-full border border-line bg-base2 px-4 py-2.5 text-[13px] text-ink outline-none focus:border-line-strong"
                />
                <Button type="submit" loading={sending} disabled={!reply.trim()}>
                  <Send size={14} />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[13px] text-ink-faint">
              Select a conversation
            </div>
          )}
        </div>
      </div>

      <NewConversationModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        customers={customers}
        form={form}
        setForm={setForm}
        onSubmit={startConversation}
        error={error}
      />
    </div>
  );
}

function NewConversationModal({
  open,
  onClose,
  customers,
  form,
  setForm,
  onSubmit,
  error,
}: {
  open: boolean;
  onClose: () => void;
  customers: { id: string; name: string; email: string }[];
  form: { subject: string; customerId: string; body: string };
  setForm: React.Dispatch<React.SetStateAction<{ subject: string; customerId: string; body: string }>>;
  onSubmit: (e: React.FormEvent) => void;
  error: string | null;
}) {
  return (
    <Modal open={open} onClose={onClose} title="New conversation">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error && <Alert kind="error">{error}</Alert>}
        <Input
          label="Subject"
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-[12.5px] font-medium text-ink-dim">Customer (optional)</label>
          <select
            value={form.customerId}
            onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none"
          >
            <option value="">No customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12.5px] font-medium text-ink-dim">Message</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={4}
            required
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none"
          />
        </div>
        <Button type="submit" full>
          Start conversation
        </Button>
      </form>
    </Modal>
  );
}
