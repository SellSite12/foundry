"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Zap, Trash2 } from "lucide-react";

import { api } from "@/lib/client/api";
import { AUTOMATION_TRIGGERS, AUTOMATION_ACTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Modal, EmptyState, Panel } from "@/components/seller/ui";

type Automation = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  runCount: number;
  createdAt: string;
};

const TRIGGER_LABELS: Record<string, string> = {
  ORDER_CREATED: "When a new order is placed",
  ORDER_SHIPPED: "When an order ships",
  REFUND_COMPLETED: "When a refund completes",
  STOCK_LOW: "When stock runs low",
  CUSTOMER_CREATED: "When a customer is added",
  CUSTOMER_BIRTHDAY: "On customer birthday",
  PRODUCT_BACK_IN_STOCK: "When a product is back in stock",
  NEW_REVIEW: "When a new review is posted",
  SUBSCRIPTION_RENEWAL: "On subscription renewal",
  CART_ABANDONED: "When a cart is abandoned (1+ hour idle)",
  REFERRAL_SIGNUP: "When a referral signs up",
  AFFILIATE_SALE: "When an affiliate drives a sale",
};

const ACTION_LABELS: Record<string, string> = {
  NOTIFY: "Send a dashboard notification",
  SEND_EMAIL: "Send an email",
  TAG_CUSTOMER: "Tag the customer",
  WEBHOOK: "Call external webhook",
  CREATE_DISCOUNT: "Create a discount code",
  CREATE_TASK: "Create an internal task",
  UPDATE_DATABASE: "Update database record",
  GENERATE_AI: "Generate AI content (review required)",
  DELAY: "Delay then continue",
  BRANCH: "Conditional branch",
};

export function AutomationManager({
  storeId,
  automations,
}: {
  storeId: string;
  automations: Automation[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", trigger: "ORDER_CREATED", action: "NOTIFY" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await api(`/api/store/${storeId}/automations`, {
      method: "POST",
      body: form,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOpen(false);
    setForm({ name: "", trigger: "ORDER_CREATED", action: "NOTIFY" });
    router.refresh();
  }

  async function toggle(a: Automation) {
    await api(`/api/store/${storeId}/automations?id=${a.id}`, {
      method: "PATCH",
      body: { enabled: !a.enabled },
    });
    router.refresh();
  }

  async function remove(a: Automation) {
    if (!confirm(`Delete automation "${a.name}"?`)) return;
    await api(`/api/store/${storeId}/automations?id=${a.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus size={14} /> New automation
        </Button>
      </div>

      {automations.length === 0 ? (
        <EmptyState
          icon={<Zap size={20} />}
          title="No automations yet"
          body="Create rules like “when stock runs low, notify me” or “when an order is created, send an email”. Rules are stored per-store and versioned with run counts."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus size={14} /> Create your first rule
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {automations.map((a) => (
            <Panel key={a.id}>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-ink">{a.name}</div>
                  <div className="mt-0.5 text-[12px] text-ink-faint">
                    {TRIGGER_LABELS[a.trigger] ?? a.trigger} →{" "}
                    {ACTION_LABELS[a.action] ?? a.action} · ran {a.runCount}×
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  <button
                    onClick={() => toggle(a)}
                    role="switch"
                    aria-checked={a.enabled}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      a.enabled ? "bg-copper" : "border border-line-strong bg-hover"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                        a.enabled ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => remove(a)}
                    className="rounded-lg p-1.5 text-ink-faint hover:text-danger"
                    aria-label="Delete automation"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New automation">
        <form onSubmit={create} className="flex flex-col gap-4" noValidate>
          {error && <Alert kind="error">{error}</Alert>}
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Low stock alert"
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-medium text-ink-dim">Trigger</label>
            <select
              value={form.trigger}
              onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none"
            >
              {AUTOMATION_TRIGGERS.map((t) => (
                <option key={t} value={t}>
                  {TRIGGER_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-medium text-ink-dim">Action</label>
            <select
              value={form.action}
              onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none"
            >
              {AUTOMATION_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {ACTION_LABELS[a]}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" loading={saving} full>
            Create automation
          </Button>
        </form>
      </Modal>
    </div>
  );
}
