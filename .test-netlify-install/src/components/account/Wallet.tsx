"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard } from "lucide-react";

import { api } from "@/lib/client/api";

type Method = {
  id: string;
  provider: string;
  method: string;
  cardBrand: string | null;
  cardLast4: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
};

const input = "w-full rounded-lg border border-line bg-base px-3 py-2.5 text-[14px] text-ink outline-none focus:border-copper";
const label = "mb-1.5 block text-[13px] font-medium text-ink";

export function Wallet() {
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [card, setCard] = useState({ number: "", expMonth: "", expYear: "", cvc: "", name: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await api<{ methods: Method[] }>("/api/account/payment-methods");
    if (res.ok) setMethods(res.data.methods);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors({});
    const res = await api("/api/account/payment-methods", {
      method: "POST",
      body: {
        card: {
          number: card.number,
          expMonth: parseInt(card.expMonth, 10) || 0,
          expYear: parseInt(card.expYear, 10) || 0,
          cvc: card.cvc,
          name: card.name,
        },
      },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      return;
    }
    setAdding(false);
    setCard({ number: "", expMonth: "", expYear: "", cvc: "", name: "" });
    load();
  }

  async function remove(id: string) {
    const res = await api(`/api/account/payment-methods?id=${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  async function makeDefault(id: string) {
    const res = await api(`/api/account/payment-methods?id=${id}`, { method: "PATCH" });
    if (res.ok) load();
  }

  if (loading) {
    return (
      <div className="mt-8 animate-pulse space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-20 rounded-2xl border border-line bg-surface" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6">
      {adding ? (
        <form onSubmit={submit} className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="text-[15px] font-semibold">Add a card</h2>
          <div className="mt-4 grid gap-4">
            <div>
              <label htmlFor="pm-name" className={label}>Name on card</label>
              <input id="pm-name" className={input} value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} required autoComplete="cc-name" />
            </div>
            <div>
              <label htmlFor="pm-number" className={label}>Card number</label>
              <input id="pm-number" className={input} inputMode="numeric" placeholder="4242 4242 4242 4242" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} required autoComplete="cc-number" />
              {fieldErrors["card.number"] ? <p className="mt-1 text-[12px] text-danger">{fieldErrors["card.number"]}</p> : null}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="pm-month" className={label}>Exp. month</label>
                <input id="pm-month" className={input} inputMode="numeric" placeholder="MM" value={card.expMonth} onChange={(e) => setCard({ ...card, expMonth: e.target.value })} required autoComplete="cc-exp-month" />
              </div>
              <div>
                <label htmlFor="pm-year" className={label}>Exp. year</label>
                <input id="pm-year" className={input} inputMode="numeric" placeholder="YYYY" value={card.expYear} onChange={(e) => setCard({ ...card, expYear: e.target.value })} required autoComplete="cc-exp-year" />
              </div>
              <div>
                <label htmlFor="pm-cvc" className={label}>CVC</label>
                <input id="pm-cvc" className={input} inputMode="numeric" placeholder="123" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} required autoComplete="cc-csc" />
              </div>
            </div>
          </div>
          {error ? <p role="alert" className="mt-3 text-[13px] font-medium text-danger">{error}</p> : null}
          <div className="mt-5 flex gap-2">
            <button type="submit" disabled={busy} className="rounded-xl bg-copper px-5 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
              {busy ? "Saving…" : "Save card"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="rounded-xl border border-line px-5 py-2.5 text-[13.5px] font-medium">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="rounded-xl bg-copper px-5 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90">
          Add card
        </button>
      )}

      {methods.length === 0 && !adding ? (
        <p className="mt-6 rounded-2xl border border-line px-6 py-10 text-center text-[13.5px] text-ink-dim">
          No saved payment methods yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {methods.map((m) => (
            <li key={m.id} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-copper/12 text-copper" aria-hidden>
                <CreditCard size={18} />
              </span>
              <div className="flex-1">
                <p className="text-[14px] font-semibold">
                  {m.cardBrand} •••• {m.cardLast4}
                  {m.isDefault ? (
                    <span className="ml-2 rounded-full bg-copper/12 px-2.5 py-0.5 text-[11px] font-semibold text-copper">Default</span>
                  ) : null}
                </p>
                <p className="text-[12.5px] text-ink-dim">
                  Expires {m.expMonth}/{m.expYear} · {m.provider === "foundry_pay" ? "Foundry Pay" : m.provider}
                </p>
              </div>
              <div className="flex gap-3 text-[12.5px] font-medium">
                {!m.isDefault ? (
                  <button onClick={() => makeDefault(m.id)} className="text-ink-dim hover:text-ink">Make default</button>
                ) : null}
                <button onClick={() => remove(m.id)} className="text-danger hover:opacity-80">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
