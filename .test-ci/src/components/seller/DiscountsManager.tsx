"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, TicketPercent, Power, Trash2 } from "lucide-react";

import { api } from "@/lib/client/api";
import { formatMoney, toCents } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Modal, EmptyState, StatusBadge, Table, Th, Td } from "@/components/seller/ui";

type Discount = {
  id: string;
  kind: string;
  code: string | null;
  title: string;
  type: string;
  value: number;
  minSubtotalCents: number | null;
  usageLimit: number | null;
  usedCount: number;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
};

const selectClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none";

export function DiscountsManager({
  storeId,
  currency,
  discounts,
}: {
  storeId: string;
  currency: string;
  discounts: Discount[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    kind: "CODE",
    code: "",
    title: "",
    type: "PERCENT",
    value: "",
    minSubtotal: "",
    usageLimit: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    const res = await api(`/api/store/${storeId}/discounts`, {
      method: "POST",
      body: {
        kind: form.kind,
        code: form.kind === "AUTOMATIC" ? null : form.code || null,
        title: form.title,
        type: form.type,
        value:
          form.type === "PERCENT"
            ? parseInt(form.value, 10) || 0
            : toCents(form.value),
        minSubtotalCents: form.minSubtotal ? toCents(form.minSubtotal) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : null,
      },
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.fieldErrors ? null : res.error);
      setFieldErrors(res.fieldErrors ?? {});
      return;
    }
    setOpen(false);
    setForm({ kind: "CODE", code: "", title: "", type: "PERCENT", value: "", minSubtotal: "", usageLimit: "" });
    router.refresh();
  }

  async function toggle(d: Discount) {
    await api(`/api/store/${storeId}/discounts?id=${d.id}`, {
      method: "PATCH",
      body: { status: d.status === "ACTIVE" ? "DISABLED" : "ACTIVE" },
    });
    router.refresh();
  }

  async function remove(d: Discount) {
    if (!confirm(`Delete discount "${d.title}"?`)) return;
    await api(`/api/store/${storeId}/discounts?id=${d.id}`, { method: "DELETE" });
    router.refresh();
  }

  function describeValue(d: Discount) {
    if (d.type === "PERCENT") return `${d.value}% off`;
    if (d.type === "FIXED_AMOUNT") return `${formatMoney(d.value, currency)} off`;
    return "Free shipping";
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus size={14} /> Create discount
        </Button>
      </div>

      {discounts.length === 0 ? (
        <EmptyState
          icon={<TicketPercent size={20} />}
          title="No discounts yet"
          body="Create discount codes, automatic discounts, or bundle deals. They're stored in your database and ready for checkout."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus size={14} /> Create your first discount
            </Button>
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Discount</Th>
              <Th>Kind</Th>
              <Th>Value</Th>
              <Th>Usage</Th>
              <Th>Status</Th>
              <Th className="w-24"></Th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => (
              <tr key={d.id} className="hover:bg-hover">
                <Td>
                  <div className="font-medium text-ink">{d.title}</div>
                  {d.code && (
                    <code className="fdy-mono text-[11.5px] text-copper">{d.code}</code>
                  )}
                </Td>
                <Td>{d.kind}</Td>
                <Td>
                  {describeValue(d)}
                  {d.minSubtotalCents && (
                    <div className="text-[11px] text-ink-faint">
                      Min {formatMoney(d.minSubtotalCents, currency)}
                    </div>
                  )}
                </Td>
                <Td className="fdy-mono">
                  {d.usedCount}
                  {d.usageLimit ? ` / ${d.usageLimit}` : ""}
                </Td>
                <Td>
                  <StatusBadge status={d.status} />
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggle(d)}
                      title={d.status === "ACTIVE" ? "Disable" : "Enable"}
                      className="rounded-lg p-1.5 text-ink-faint hover:bg-hover hover:text-ink"
                    >
                      <Power size={14} />
                    </button>
                    <button
                      onClick={() => remove(d)}
                      title="Delete"
                      className="rounded-lg p-1.5 text-ink-faint hover:bg-hover hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create discount">
        <form onSubmit={create} className="flex flex-col gap-4" noValidate>
          {error && <Alert kind="error">{error}</Alert>}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-medium text-ink-dim">Kind</label>
            <select value={form.kind} onChange={(e) => set("kind", e.target.value)} className={selectClass}>
              <option value="CODE">Discount code (coupon)</option>
              <option value="AUTOMATIC">Automatic discount</option>
              <option value="BUNDLE">Bundle deal</option>
            </select>
          </div>
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            error={fieldErrors.title}
            placeholder="Summer sale"
            required
          />
          {form.kind !== "AUTOMATIC" && (
            <Input
              label="Code"
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              error={fieldErrors.code}
              placeholder="SUMMER20"
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-ink-dim">Type</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className={selectClass}>
                <option value="PERCENT">Percentage</option>
                <option value="FIXED_AMOUNT">Fixed amount</option>
                <option value="FREE_SHIPPING">Free shipping</option>
              </select>
            </div>
            {form.type !== "FREE_SHIPPING" && (
              <Input
                label={form.type === "PERCENT" ? "Percent off" : `Amount (${currency})`}
                type="number"
                min="0"
                step={form.type === "PERCENT" ? "1" : "0.01"}
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                error={fieldErrors.value}
                required
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`Min subtotal (${currency})`}
              type="number"
              min="0"
              step="0.01"
              value={form.minSubtotal}
              onChange={(e) => set("minSubtotal", e.target.value)}
            />
            <Input
              label="Usage limit"
              type="number"
              min="1"
              value={form.usageLimit}
              onChange={(e) => set("usageLimit", e.target.value)}
              placeholder="Unlimited"
            />
          </div>
          <Button type="submit" loading={saving} full>
            Create discount
          </Button>
        </form>
      </Modal>
    </div>
  );
}
