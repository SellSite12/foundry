"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Truck, Power, Trash2 } from "lucide-react";

import { api } from "@/lib/client/api";
import { formatMoney, toCents } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Modal, EmptyState, StatusBadge, Table, Th, Td } from "@/components/seller/ui";

type Rate = {
  id: string;
  name: string;
  kind: string;
  region: string;
  countries: string | null;
  priceCents: number;
  freeAboveCents: number | null;
  minDays: number | null;
  maxDays: number | null;
  active: boolean;
};

export function ShippingManager({
  storeId,
  currency,
  rates,
}: {
  storeId: string;
  currency: string;
  rates: Rate[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    kind: "DELIVERY",
    region: "Everywhere",
    countries: "",
    price: "",
    freeAbove: "",
    minDays: "",
    maxDays: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await api(`/api/store/${storeId}/shipping`, {
      method: "POST",
      body: {
        name: form.name,
        kind: form.kind,
        region: form.region || "Everywhere",
        countries: form.countries.trim() || null,
        priceCents: toCents(form.price),
        freeAboveCents: form.freeAbove ? toCents(form.freeAbove) : null,
        minDays: form.minDays ? parseInt(form.minDays, 10) : null,
        maxDays: form.maxDays ? parseInt(form.maxDays, 10) : null,
      },
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOpen(false);
    setForm({ name: "", kind: "DELIVERY", region: "Everywhere", countries: "", price: "", freeAbove: "", minDays: "", maxDays: "" });
    router.refresh();
  }

  async function toggle(rate: Rate) {
    await api(`/api/store/${storeId}/shipping?id=${rate.id}`, {
      method: "PATCH",
      body: { active: !rate.active },
    });
    router.refresh();
  }

  async function remove(rate: Rate) {
    if (!confirm(`Delete shipping rate "${rate.name}"?`)) return;
    await api(`/api/store/${storeId}/shipping?id=${rate.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus size={14} /> Add rate
        </Button>
      </div>

      {rates.length === 0 ? (
        <EmptyState
          icon={<Truck size={20} />}
          title="No shipping rates yet"
          body="Define the shipping options your customers choose at checkout — flat rates, regions, free-over thresholds, and delivery estimates."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus size={14} /> Add your first rate
            </Button>
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Rate</Th>
              <Th>Region</Th>
              <Th>Price</Th>
              <Th>Free over</Th>
              <Th>Delivery</Th>
              <Th>Status</Th>
              <Th className="w-24"></Th>
            </tr>
          </thead>
          <tbody>
            {rates.map((r) => (
              <tr key={r.id} className="hover:bg-hover">
                <Td className="font-medium text-ink">
                  {r.name}
                  {r.kind === "PICKUP" && (
                    <span className="ml-2 rounded-full bg-copper-soft px-2 py-0.5 text-[10.5px] font-semibold text-copper">
                      Pickup
                    </span>
                  )}
                </Td>
                <Td>{r.countries ? r.countries : r.region}</Td>
                <Td className="fdy-mono">
                  {r.priceCents === 0 ? "Free" : formatMoney(r.priceCents, currency)}
                </Td>
                <Td>{r.freeAboveCents ? formatMoney(r.freeAboveCents, currency) : "—"}</Td>
                <Td>
                  {r.minDays !== null || r.maxDays !== null
                    ? `${r.minDays ?? "?"}–${r.maxDays ?? "?"} days`
                    : "—"}
                </Td>
                <Td>
                  <StatusBadge status={r.active ? "ACTIVE" : "DISABLED"} />
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggle(r)}
                      title={r.active ? "Disable" : "Enable"}
                      className="rounded-lg p-1.5 text-ink-faint hover:bg-hover hover:text-ink"
                    >
                      <Power size={14} />
                    </button>
                    <button
                      onClick={() => remove(r)}
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

      <Modal open={open} onClose={() => setOpen(false)} title="Add shipping rate">
        <form onSubmit={create} className="flex flex-col gap-4" noValidate>
          {error && <Alert kind="error">{error}</Alert>}
          <Input
            label="Rate name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Standard shipping"
            required
          />
          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-ink">Type</span>
            <div className="flex gap-2" role="radiogroup" aria-label="Rate type">
              {[
                ["DELIVERY", "Delivery"],
                ["PICKUP", "Local pickup"],
              ].map(([key, text]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={form.kind === key}
                  onClick={() => set("kind", key)}
                  className={`rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors ${
                    form.kind === key ? "border-copper text-copper" : "border-line text-ink-dim hover:text-ink"
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Region"
            value={form.region}
            onChange={(e) => set("region", e.target.value)}
            placeholder="Everywhere, Domestic, EU…"
          />
          {form.kind === "DELIVERY" && (
            <Input
              label="Countries (comma-separated, blank = everywhere)"
              value={form.countries}
              onChange={(e) => set("countries", e.target.value)}
              placeholder="United States, Canada"
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`Price (${currency})`}
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              required
            />
            <Input
              label={`Free over (${currency})`}
              type="number"
              min="0"
              step="0.01"
              value={form.freeAbove}
              onChange={(e) => set("freeAbove", e.target.value)}
            />
            <Input
              label="Min days"
              type="number"
              min="0"
              value={form.minDays}
              onChange={(e) => set("minDays", e.target.value)}
            />
            <Input
              label="Max days"
              type="number"
              min="0"
              value={form.maxDays}
              onChange={(e) => set("maxDays", e.target.value)}
            />
          </div>
          <Button type="submit" loading={saving} full>
            Add rate
          </Button>
        </form>
      </Modal>
    </div>
  );
}
