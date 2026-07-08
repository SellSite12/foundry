"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/client/api";
import { AddressFields } from "@/components/ui/AddressFields";

type Address = {
  id: string;
  label: string;
  name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type FormState = {
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

const EMPTY: FormState = {
  label: "Home",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  isDefault: false,
};

const input = "w-full rounded-lg border border-line bg-base px-3 py-2.5 text-[14px] text-ink outline-none focus:border-copper";
const label = "mb-1.5 block text-[13px] font-medium text-ink";

export function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api<{ addresses: Address[] }>("/api/account/addresses");
    if (res.ok) setAddresses(res.data.addresses);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startNew() {
    setEditing("new");
    setForm(EMPTY);
    setError(null);
  }

  function startEdit(a: Address) {
    setEditing(a.id);
    setForm({
      label: a.label,
      name: a.name,
      phone: a.phone ?? "",
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      state: a.state ?? "",
      postalCode: a.postalCode,
      country: a.country,
      isDefault: a.isDefault,
    });
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      label: form.label,
      name: form.name,
      phone: form.phone || null,
      line1: form.line1,
      line2: form.line2 || null,
      city: form.city,
      state: form.state || null,
      postalCode: form.postalCode,
      country: form.country,
      isDefault: form.isDefault,
    };
    const res =
      editing === "new"
        ? await api("/api/account/addresses", { method: "POST", body })
        : await api(`/api/account/addresses?id=${editing}`, { method: "PATCH", body });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    const res = await api(`/api/account/addresses?id=${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  async function makeDefault(id: string) {
    const res = await api(`/api/account/addresses?id=${id}`, {
      method: "PATCH",
      body: { isDefault: true },
    });
    if (res.ok) load();
  }

  if (loading) {
    return (
      <div className="mt-8 animate-pulse space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-24 rounded-2xl border border-line bg-surface" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6">
      {editing ? (
        <form onSubmit={submit} className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="text-[15px] font-semibold">{editing === "new" ? "Add address" : "Edit address"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="adr-label" className={label}>Label</label>
              <input id="adr-label" className={input} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home, Work…" required />
            </div>
            <div>
              <label htmlFor="adr-name" className={label}>Full name</label>
              <input id="adr-name" className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="name" />
            </div>
            <div>
              <label htmlFor="adr-phone" className={label}>Phone (optional)</label>
              <input id="adr-phone" className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
            </div>
            <div className="sm:col-span-2">
              <AddressFields
                idPrefix="adr"
                variant="plain"
                inputClassName={input}
                labelClassName={label}
                line2Label="Address line 2 (optional)"
                stateLabel="State / region"
                gridClassName="grid gap-4 sm:grid-cols-2"
                value={{
                  line1: form.line1,
                  line2: form.line2,
                  city: form.city,
                  state: form.state,
                  postalCode: form.postalCode,
                  country: form.country,
                }}
                onChange={(address) =>
                  setForm((f) => ({
                    ...f,
                    line1: address.line1,
                    line2: address.line2,
                    city: address.city,
                    state: address.state,
                    postalCode: address.postalCode,
                    country: address.country,
                  }))
                }
              />
            </div>
          </div>
          <label className="mt-4 flex items-center gap-2 text-[13.5px] text-ink-dim">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Use as default address
          </label>
          {error ? <p role="alert" className="mt-3 text-[13px] font-medium text-danger">{error}</p> : null}
          <div className="mt-5 flex gap-2">
            <button type="submit" disabled={busy} className="rounded-xl bg-copper px-5 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
              {busy ? "Saving…" : "Save address"}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-line px-5 py-2.5 text-[13.5px] font-medium">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button onClick={startNew} className="rounded-xl bg-copper px-5 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90">
          Add address
        </button>
      )}

      {addresses.length === 0 && !editing ? (
        <p className="mt-6 rounded-2xl border border-line px-6 py-10 text-center text-[13.5px] text-ink-dim">
          No saved addresses yet.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold">{a.label}</span>
                {a.isDefault ? (
                  <span className="rounded-full bg-copper/12 px-2.5 py-0.5 text-[11px] font-semibold text-copper">Default</span>
                ) : null}
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-dim">
                {a.name}<br />
                {a.line1}{a.line2 ? <><br />{a.line2}</> : null}<br />
                {a.city}{a.state ? `, ${a.state}` : ""} {a.postalCode}<br />
                {a.country}
              </p>
              <div className="mt-3 flex gap-3 text-[12.5px] font-medium">
                <button onClick={() => startEdit(a)} className="text-copper hover:opacity-80">Edit</button>
                {!a.isDefault ? (
                  <button onClick={() => makeDefault(a.id)} className="text-ink-dim hover:text-ink">Make default</button>
                ) : null}
                <button onClick={() => remove(a.id)} className="text-danger hover:opacity-80">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
