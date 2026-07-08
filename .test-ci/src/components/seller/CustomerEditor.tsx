"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, Check } from "lucide-react";

import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Panel } from "@/components/seller/ui";

type CustomerForm = {
  id: string;
  name: string;
  email: string;
  phone: string;
  tags: string;
  notes: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export function CustomerEditor({
  storeId,
  customer,
}: {
  storeId: string;
  customer: CustomerForm;
}) {
  const router = useRouter();
  const [form, setForm] = useState(customer);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof CustomerForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    setError(null);
    const res = await api(`/api/store/${storeId}/customers/${customer.id}`, {
      method: "PATCH",
      body: {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        tags: form.tags || null,
        notes: form.notes || null,
        addressLine1: form.addressLine1 || null,
        addressLine2: form.addressLine2 || null,
        city: form.city || null,
        state: form.state || null,
        postalCode: form.postalCode || null,
        country: form.country || null,
      },
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this customer? Their orders remain but lose the profile link.")) return;
    const res = await api(`/api/store/${storeId}/customers/${customer.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push(`/store/${storeId}/customers`);
      router.refresh();
    }
  }

  return (
    <Panel title="Profile">
      <div className="flex flex-col gap-3.5">
        {error && <Alert kind="error">{error}</Alert>}
        {saved && (
          <div className="fdy-pop flex items-center gap-2 rounded-xl bg-success-soft px-3.5 py-2 text-[12.5px] text-success">
            <Check size={13} /> Saved
          </div>
        )}
        <Input label="Name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
        <Input label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        <Input
          label="Tags"
          value={form.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="vip, wholesale"
        />
        <Input
          label="Address"
          value={form.addressLine1}
          onChange={(e) => set("addressLine1", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="City" value={form.city} onChange={(e) => set("city", e.target.value)} />
          <Input
            label="Postal code"
            value={form.postalCode}
            onChange={(e) => set("postalCode", e.target.value)}
          />
        </div>
        <Input
          label="Country"
          value={form.country}
          onChange={(e) => set("country", e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-[12.5px] font-medium text-ink-dim">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-line-strong"
          />
        </div>
        <Button onClick={save} loading={saving} full>
          <Save size={14} /> Save profile
        </Button>
        <Button variant="ghost" onClick={remove} full>
          <span className="flex items-center gap-2 text-danger">
            <Trash2 size={14} /> Delete customer
          </span>
        </Button>
      </div>
    </Panel>
  );
}
