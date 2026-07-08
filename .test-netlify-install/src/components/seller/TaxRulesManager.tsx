"use client";

import { useState } from "react";

import { api } from "@/lib/client/api";

type TaxRule = {
  id: string;
  name: string;
  country: string;
  state: string | null;
  rate: number;
  active: boolean;
};

const input =
  "w-full rounded-lg border border-line bg-base px-3 py-2 text-[13.5px] text-ink outline-none focus:border-copper";

export function TaxRulesManager({
  storeId,
  initialRules,
}: {
  storeId: string;
  initialRules: TaxRule[];
}) {
  const [rules, setRules] = useState<TaxRule[]>(initialRules);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", country: "", state: "", rate: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await api<{ rules: TaxRule[] }>(`/api/store/${storeId}/tax-rules`);
    if (res.ok) setRules(res.data.rules);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await api(`/api/store/${storeId}/tax-rules`, {
      method: "POST",
      body: {
        name: form.name,
        country: form.country,
        state: form.state || null,
        rate: parseFloat(form.rate) || 0,
      },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setAdding(false);
    setForm({ name: "", country: "", state: "", rate: "" });
    reload();
  }

  async function toggle(rule: TaxRule) {
    const res = await api(`/api/store/${storeId}/tax-rules?id=${rule.id}`, {
      method: "PATCH",
      body: { active: !rule.active },
    });
    if (res.ok) reload();
  }

  async function remove(id: string) {
    const res = await api(`/api/store/${storeId}/tax-rules?id=${id}`, { method: "DELETE" });
    if (res.ok) reload();
  }

  return (
    <div>
      <p className="text-[13px] text-ink-dim">
        Region rules override the default tax rate at checkout. The most specific match wins:
        country + state, then country, then <code className="text-ink">*</code> (everywhere).
        Customers marked tax-exempt in your CRM are never charged tax.
      </p>

      {rules.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {rules.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-base px-4 py-3 text-[13.5px]"
            >
              <div>
                <span className="font-medium text-ink">{r.name}</span>
                <span className="ml-2 text-ink-dim">
                  {r.country === "*" ? "Everywhere" : r.country}
                  {r.state ? ` / ${r.state}` : ""} — {r.rate}%
                </span>
                {!r.active ? (
                  <span className="ml-2 rounded-full bg-line px-2 py-0.5 text-[11px] font-medium text-ink-dim">
                    Inactive
                  </span>
                ) : null}
              </div>
              <div className="flex gap-3 text-[12.5px] font-medium">
                <button onClick={() => toggle(r)} className="text-ink-dim hover:text-ink">
                  {r.active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => remove(r.id)} className="text-danger hover:opacity-80">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-6 text-center text-[13px] text-ink-dim">
          No region rules yet — the store default rate applies everywhere.
        </p>
      )}

      {adding ? (
        <form onSubmit={submit} className="mt-4 grid gap-3 rounded-xl border border-line bg-base p-4 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Rule name (e.g. California sales tax)"
            required
            aria-label="Rule name"
            className={input}
          />
          <input
            value={form.rate}
            onChange={(e) => setForm({ ...form, rate: e.target.value })}
            placeholder="Rate % (e.g. 8.25)"
            required
            inputMode="decimal"
            aria-label="Tax rate percent"
            className={input}
          />
          <input
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            placeholder="Country (or * for everywhere)"
            required
            aria-label="Country"
            className={input}
          />
          <input
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            placeholder="State / region (optional)"
            aria-label="State or region"
            className={input}
          />
          {error ? <p className="text-[12.5px] font-medium text-danger sm:col-span-2" role="alert">{error}</p> : null}
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-copper px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Adding…" : "Add rule"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="rounded-xl border border-line px-4 py-2 text-[13px] font-medium">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-4 rounded-xl border border-line px-4 py-2 text-[13px] font-medium text-ink-dim transition-colors hover:border-copper hover:text-copper"
        >
          + Add tax rule
        </button>
      )}
    </div>
  );
}
