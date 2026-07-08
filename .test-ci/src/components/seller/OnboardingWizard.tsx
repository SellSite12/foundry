"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { api } from "@/lib/client/api";
import { INDUSTRIES, CURRENCIES, TIMEZONES } from "@/lib/constants";

type StoreDraft = {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  website: string | null;
  phone: string | null;
  businessEmail: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  taxId: string | null;
  taxRate: number;
  taxInclusive: boolean;
  timezone: string;
  currency: string;
  brandColor: string;
  logo: string | null;
  onboardingStep: number;
};

const STEPS = ["Business", "Contact", "Locale & tax", "Branding", "Review"];

const selectClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-line-strong";
const labelClass = "text-[12.5px] font-medium text-ink-dim";

export function OnboardingWizard({ store }: { store: StoreDraft }) {
  const router = useRouter();
  const [step, setStep] = useState(Math.min(Math.max(store.onboardingStep, 2), 5) - 1); // 0-based UI index
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: store.name,
    description: store.description ?? "",
    industry: store.industry ?? "",
    website: store.website ?? "",
    phone: store.phone ?? "",
    businessEmail: store.businessEmail ?? "",
    addressLine1: store.addressLine1 ?? "",
    addressLine2: store.addressLine2 ?? "",
    city: store.city ?? "",
    state: store.state ?? "",
    postalCode: store.postalCode ?? "",
    country: store.country ?? "",
    taxId: store.taxId ?? "",
    taxRate: String(store.taxRate ?? 0),
    taxInclusive: store.taxInclusive,
    timezone: store.timezone,
    currency: store.currency,
    brandColor: store.brandColor,
    logo: store.logo ?? "",
  });

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  function payloadForStep(i: number): Record<string, unknown> {
    switch (i) {
      case 0:
        return {
          name: form.name,
          description: form.description || null,
          industry: form.industry || null,
        };
      case 1:
        return {
          website: form.website || null,
          phone: form.phone || null,
          businessEmail: form.businessEmail || null,
          addressLine1: form.addressLine1 || null,
          addressLine2: form.addressLine2 || null,
          city: form.city || null,
          state: form.state || null,
          postalCode: form.postalCode || null,
          country: form.country || null,
        };
      case 2:
        return {
          taxId: form.taxId || null,
          taxRate: parseFloat(form.taxRate) || 0,
          taxInclusive: form.taxInclusive,
          timezone: form.timezone,
          currency: form.currency,
        };
      case 3:
        return {
          brandColor: form.brandColor,
          logo: form.logo || null,
        };
      default:
        return {};
    }
  }

  async function saveStep(nextStep: number, finish = false) {
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const result = await api(`/api/store/${store.id}/settings`, {
      method: "PATCH",
      body: {
        ...payloadForStep(step),
        onboardingStep: Math.max(nextStep + 1, store.onboardingStep),
        ...(finish && { onboardingDone: true }),
      },
    });

    if (!result.ok) {
      setError(result.fieldErrors ? null : result.error);
      setFieldErrors(result.fieldErrors ?? {});
      setSaving(false);
      return;
    }

    if (finish) {
      router.push(`/store/${store.id}`);
      router.refresh();
      return;
    }
    setStep(nextStep);
    setSaving(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-base px-4 py-10">
      <div className="mb-8 flex items-center gap-2">
        <div className="fdy-display flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[#E8A33D] to-[#B85C2E] font-bold text-[#0C0A09]">
          F
        </div>
        <span className="fdy-display text-[16px] font-semibold text-ink">Foundry</span>
      </div>

      {/* progress */}
      <div className="mb-8 flex w-full max-w-xl items-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold transition-colors ${
                  i < step
                    ? "bg-copper text-base"
                    : i === step
                      ? "border-2 border-copper text-copper"
                      : "border border-line-strong text-ink-faint"
                }`}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={`mt-1.5 hidden text-[10.5px] sm:block ${
                  i === step ? "text-copper" : "text-ink-faint"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 h-px flex-1 ${i < step ? "bg-copper" : "bg-line-strong"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="w-full max-w-xl rounded-2xl border border-line-strong bg-base2 p-7 shadow-[0_40px_100px_rgba(0,0,0,0.3)]">
        {error && (
          <div className="mb-4">
            <Alert kind="error">{error}</Alert>
          </div>
        )}

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h1 className="fdy-display text-[20px] font-semibold text-ink">
              Tell us about your business
            </h1>
            <Input
              label="Business name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              error={fieldErrors.name}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Business description</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className={selectClass}
                placeholder="What do you sell?"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Industry</label>
              <select
                value={form.industry}
                onChange={(e) => set("industry", e.target.value)}
                className={selectClass}
              >
                <option value="">Select an industry…</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h1 className="fdy-display text-[20px] font-semibold text-ink">
              Contact & address
            </h1>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Business email"
                type="email"
                value={form.businessEmail}
                onChange={(e) => set("businessEmail", e.target.value)}
                error={fieldErrors.businessEmail}
                placeholder="orders@yourbusiness.com"
              />
              <Input
                label="Phone number"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                error={fieldErrors.phone}
                placeholder="+1 555 000 1234"
              />
            </div>
            <Input
              label="Website"
              type="url"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              error={fieldErrors.website}
              placeholder="https://yourbusiness.com"
            />
            <Input
              label="Address line 1"
              value={form.addressLine1}
              onChange={(e) => set("addressLine1", e.target.value)}
            />
            <Input
              label="Address line 2"
              value={form.addressLine2}
              onChange={(e) => set("addressLine2", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" value={form.city} onChange={(e) => set("city", e.target.value)} />
              <Input
                label="State / Province"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
              />
              <Input
                label="Postal code"
                value={form.postalCode}
                onChange={(e) => set("postalCode", e.target.value)}
              />
              <Input
                label="Country"
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h1 className="fdy-display text-[20px] font-semibold text-ink">Locale & tax</h1>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </div>
            <Input
              label="Tax ID / VAT number"
              value={form.taxId}
              onChange={(e) => set("taxId", e.target.value)}
              hint="Shown on invoices. Leave blank if you don't have one yet."
            />
            <Input
              label="Default tax rate (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.taxRate}
              onChange={(e) => set("taxRate", e.target.value)}
              error={fieldErrors.taxRate}
            />
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-dim">
              <input
                type="checkbox"
                checked={form.taxInclusive}
                onChange={(e) => set("taxInclusive", e.target.checked)}
                className="h-4 w-4 accent-[#E8A33D]"
              />
              Prices already include tax
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h1 className="fdy-display text-[20px] font-semibold text-ink">Branding</h1>
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
              hint="You can also upload images later in Files and paste the URL here."
            />
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <h1 className="fdy-display text-[20px] font-semibold text-ink">Review & launch</h1>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-line bg-surface p-4 text-[13px]">
              {[
                ["Business", form.name],
                ["Industry", form.industry || "—"],
                ["Email", form.businessEmail || "—"],
                ["Phone", form.phone || "—"],
                ["Currency", form.currency],
                ["Time zone", form.timezone],
                ["Tax rate", `${form.taxRate || 0}%`],
                ["Country", form.country || "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-[11px] uppercase tracking-wide text-ink-faint">{k}</div>
                  <div className="mt-0.5 truncate text-ink">{v}</div>
                </div>
              ))}
            </div>
            <p className="text-[12.5px] leading-relaxed text-ink-faint">
              You can change any of this later in Settings. Finishing setup opens
              your seller dashboard.
            </p>
          </div>
        )}

        <div className="mt-7 flex items-center justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={saving}>
              <ArrowLeft size={14} /> Back
            </Button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => saveStep(step + 1)} loading={saving}>
              Save & continue <ArrowRight size={14} />
            </Button>
          ) : (
            <Button onClick={() => saveStep(step, true)} loading={saving}>
              Finish setup <Check size={14} />
            </Button>
          )}
        </div>
      </div>

      <p className="mt-6 text-[12px] text-ink-faint">
        Progress is saved after every step — you can come back anytime.
      </p>
    </div>
  );
}
