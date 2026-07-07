"use client";

import { useState } from "react";
import { Check, Globe } from "lucide-react";

import { api } from "@/lib/client/api";

export function CustomDomainForm({
  storeId,
  storeSlug,
  initialDomain,
}: {
  storeId: string;
  storeSlug: string;
  initialDomain: string | null;
}) {
  const [domain, setDomain] = useState(initialDomain ?? "");
  const [connected, setConnected] = useState(initialDomain);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(value: string | null) {
    setBusy(true);
    setError(null);
    setSaved(false);
    const res = await api(`/api/store/${storeId}/settings`, {
      method: "PATCH",
      body: { customDomain: value },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setConnected(value);
    if (!value) setDomain("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="text-[13.5px]">
      <div className="flex items-center gap-2 rounded-xl border border-line bg-base px-4 py-3">
        <Globe size={15} className="shrink-0 text-copper" aria-hidden />
        <a href={`/shop/${storeSlug}`} target="_blank" rel="noreferrer" className="truncate text-ink hover:text-copper">
          /shop/{storeSlug}
        </a>
        <span className="ml-auto shrink-0 rounded-full bg-success-soft px-2.5 py-0.5 text-[11px] font-semibold text-success">
          Live
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(domain.trim().toLowerCase() || null);
        }}
        className="mt-4"
      >
        <label htmlFor="custom-domain" className="mb-1.5 block text-[12.5px] font-medium text-ink">
          Custom domain
        </label>
        <div className="flex gap-2">
          <input
            id="custom-domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="shop.yourbrand.com"
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-[13.5px] text-ink outline-none focus:border-copper"
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-lg bg-copper px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Connect"}
          </button>
        </div>
      </form>

      {connected ? (
        <div className="mt-3 rounded-xl border border-line bg-base px-4 py-3">
          <p className="font-medium text-ink">{connected}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-dim">
            Reserved for your store. To go live, point a CNAME record at your Foundry deployment —
            requests for this hostname will resolve to your storefront.
          </p>
          <button
            type="button"
            onClick={() => save(null)}
            className="mt-2 text-[12.5px] font-medium text-danger hover:opacity-80"
          >
            Disconnect domain
          </button>
        </div>
      ) : null}

      {saved ? (
        <p className="mt-2 flex items-center gap-1 text-[12.5px] font-medium text-success" role="status">
          <Check size={13} aria-hidden /> Saved
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-[12.5px] font-medium text-danger" role="alert">{error}</p>
      ) : null}
    </div>
  );
}
