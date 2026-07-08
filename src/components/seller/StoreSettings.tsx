"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { api } from "@/lib/client/api";
import { INDUSTRIES, CURRENCIES, TIMEZONES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AddressFields } from "@/components/ui/AddressFields";
import { Alert } from "@/components/ui/Alert";
import { Panel } from "@/components/seller/ui";

type StoreForm = {
  id: string;
  name: string;
  description: string;
  industry: string;
  website: string;
  phone: string;
  businessEmail: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  taxId: string;
  taxRate: string;
  taxInclusive: boolean;
  timezone: string;
  currency: string;
  brandColor: string;
  logo: string;
  status: string;
};

const selectClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-line-strong";
const labelClass = "text-[12.5px] font-medium text-ink-dim";

export function StoreSettings({ store, isOwner }: { store: StoreForm; isOwner: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState(store);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const set = (k: keyof StoreForm, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function save(section: string, payload: Record<string, unknown>) {
    setSaving(section);
    setError(null);
    setFieldErrors({});
    const res = await api(`/api/store/${store.id}/settings`, {
      method: "PATCH",
      body: payload,
    });
    setSaving(null);
    if (!res.ok) {
      setError(res.error);
      setFieldErrors(res.fieldErrors ?? {});
      return;
    }
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 2000);
    router.refresh();
  }

  async function deleteStore(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm(`Permanently delete "${store.name}" and ALL of its data? This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    const res = await api(`/api/store/${store.id}/settings`, {
      method: "DELETE",
      body: { password: deletePassword },
    });
    setDeleting(false);
    if (!res.ok) {
      setDeleteError(res.error);
      return;
    }
    router.push("/dashboard/stores");
    router.refresh();
  }

  const SavedBadge = ({ section }: { section: string }) =>
    savedSection === section ? (
      <span className="fdy-pop flex items-center gap-1.5 text-[12px] text-success">
        <Check size={13} /> Saved
      </span>
    ) : null;

  return (
    <div className="flex flex-col gap-5">
      {error && <Alert kind="error">{error}</Alert>}

      {/* Store profile */}
      <Panel title="Store profile" actions={<SavedBadge section="profile" />}>
        <div className="flex flex-col gap-4">
          <Input
            label="Store name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            error={fieldErrors.name}
          />
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className={selectClass}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Industry</label>
              <select
                value={form.industry}
                onChange={(e) => set("industry", e.target.value)}
                className={selectClass}
              >
                <option value="">Not set</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Store status</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className={selectClass}
              >
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>
          </div>
          <div>
            <Button
              onClick={() =>
                save("profile", {
                  name: form.name,
                  description: form.description || null,
                  industry: form.industry || null,
                  status: form.status,
                })
              }
              loading={saving === "profile"}
            >
              Save profile
            </Button>
          </div>
        </div>
      </Panel>

      {/* Contact & address */}
      <Panel title="Contact & address" actions={<SavedBadge section="contact" />}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Business email"
              type="email"
              value={form.businessEmail}
              onChange={(e) => set("businessEmail", e.target.value)}
              error={fieldErrors.businessEmail}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          <Input
            label="Website"
            type="url"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            error={fieldErrors.website}
          />
          <AddressFields
            value={{
              line1: form.addressLine1,
              line2: form.addressLine2,
              city: form.city,
              state: form.state,
              postalCode: form.postalCode,
              country: form.country,
            }}
            onChange={(address) =>
              setForm((f) => ({
                ...f,
                addressLine1: address.line1,
                addressLine2: address.line2,
                city: address.city,
                state: address.state,
                postalCode: address.postalCode,
                country: address.country,
              }))
            }
            gridClassName="grid grid-cols-2 gap-4 sm:grid-cols-4"
            stateLabel="State"
          />
          <div>
            <Button
              onClick={() =>
                save("contact", {
                  businessEmail: form.businessEmail || null,
                  phone: form.phone || null,
                  website: form.website || null,
                  addressLine1: form.addressLine1 || null,
                  addressLine2: form.addressLine2 || null,
                  city: form.city || null,
                  state: form.state || null,
                  postalCode: form.postalCode || null,
                  country: form.country || null,
                })
              }
              loading={saving === "contact"}
            >
              Save contact info
            </Button>
          </div>
        </div>
      </Panel>

      {/* Tax & locale */}
      <Panel
        id="tax"
        title="Tax, currency & locale"
        description="Applied to new orders; existing orders keep their totals."
        actions={<SavedBadge section="tax" />}
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Currency</label>
              <select
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
                className={selectClass}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Time zone</label>
              <select
                value={form.timezone}
                onChange={(e) => set("timezone", e.target.value)}
                className={selectClass}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Tax rate (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.taxRate}
              onChange={(e) => set("taxRate", e.target.value)}
              error={fieldErrors.taxRate}
            />
          </div>
          <Input
            label="Tax ID / VAT number"
            value={form.taxId}
            onChange={(e) => set("taxId", e.target.value)}
            hint="Shown on invoices"
          />
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-dim">
            <input
              type="checkbox"
              checked={form.taxInclusive}
              onChange={(e) => set("taxInclusive", e.target.checked)}
              className="h-4 w-4 accent-[#E8A33D]"
            />
            Prices include tax
          </label>
          <div>
            <Button
              onClick={() =>
                save("tax", {
                  currency: form.currency,
                  timezone: form.timezone,
                  taxRate: parseFloat(form.taxRate) || 0,
                  taxId: form.taxId || null,
                  taxInclusive: form.taxInclusive,
                })
              }
              loading={saving === "tax"}
            >
              Save tax & locale
            </Button>
          </div>
        </div>
      </Panel>

      {/* Branding */}
      <Panel id="branding" title="Branding" actions={<SavedBadge section="branding" />}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div
              className="fdy-display flex h-14 w-14 items-center justify-center rounded-xl text-[20px] font-bold text-white"
              style={{ background: form.brandColor }}
            >
              {form.name[0]?.toUpperCase() ?? "S"}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Brand color</label>
              <input
                type="color"
                value={form.brandColor}
                onChange={(e) => set("brandColor", e.target.value)}
                className="h-9 w-20 cursor-pointer rounded border border-line bg-surface"
              />
            </div>
          </div>
          <Input
            label="Logo URL"
            type="url"
            value={form.logo}
            onChange={(e) => set("logo", e.target.value)}
            error={fieldErrors.logo}
            hint="Upload in Files, then paste the URL here"
          />
          <div>
            <Button
              onClick={() =>
                save("branding", { brandColor: form.brandColor, logo: form.logo || null })
              }
              loading={saving === "branding"}
            >
              Save branding
            </Button>
          </div>
        </div>
      </Panel>

      {/* Danger zone */}
      {isOwner && (
        <Panel
          title="Danger zone"
          description="Deleting the store removes products, orders, customers, media, and team access permanently."
          className="border-danger/25"
        >
          <form onSubmit={deleteStore} className="flex flex-col gap-4 sm:max-w-sm" noValidate>
            {deleteError && <Alert kind="error">{deleteError}</Alert>}
            <Input
              label="Confirm your account password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              required
            />
            <Button type="submit" variant="ghost" loading={deleting}>
              <span className="text-danger">Delete this store permanently</span>
            </Button>
          </form>
        </Panel>
      )}
    </div>
  );
}
