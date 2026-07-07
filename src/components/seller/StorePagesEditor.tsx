"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { api } from "@/lib/client/api";

type PageDraft = { slug: string; title: string; content: string };

const PAGE_META: { slug: string; label: string; hint: string }[] = [
  { slug: "about", label: "About", hint: "Your story — who you are and what you make." },
  { slug: "contact", label: "Contact", hint: "Intro text shown above the contact form." },
  { slug: "privacy", label: "Privacy Policy", hint: "How you handle customer data." },
  { slug: "terms", label: "Terms of Service", hint: "Order, pricing, and return terms." },
];

export function StorePagesEditor({
  storeId,
  initialPages,
}: {
  storeId: string;
  initialPages: PageDraft[];
}) {
  const [active, setActive] = useState("about");
  const [pages, setPages] = useState<Record<string, PageDraft>>(() => {
    const map: Record<string, PageDraft> = {};
    for (const meta of PAGE_META) {
      const existing = initialPages.find((p) => p.slug === meta.slug);
      map[meta.slug] = existing ?? { slug: meta.slug, title: meta.label, content: "" };
    }
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const page = pages[active];
  const meta = PAGE_META.find((m) => m.slug === active)!;

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await api(`/api/store/${storeId}/pages`, {
      method: "PUT",
      body: { slug: page.slug, title: page.title, content: page.content || null },
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Storefront pages">
        {PAGE_META.map((m) => (
          <button
            key={m.slug}
            type="button"
            role="tab"
            aria-selected={active === m.slug}
            onClick={() => setActive(m.slug)}
            className={`rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors ${
              active === m.slug ? "border-copper text-copper" : "border-line text-ink-dim hover:text-ink"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-[12.5px] text-ink-dim">
        {meta.hint} Leave blank to use the auto-generated default.
      </p>

      <div className="mt-4 space-y-3">
        <input
          value={page.title}
          onChange={(e) => setPages((p) => ({ ...p, [active]: { ...page, title: e.target.value } }))}
          aria-label="Page title"
          className="w-full rounded-lg border border-line bg-base px-3 py-2.5 text-[14px] font-medium text-ink outline-none focus:border-copper"
        />
        <textarea
          value={page.content}
          onChange={(e) => setPages((p) => ({ ...p, [active]: { ...page, content: e.target.value } }))}
          rows={10}
          placeholder="Write the page content… (plain text, blank lines create paragraphs)"
          aria-label="Page content"
          className="w-full rounded-lg border border-line bg-base px-3 py-2.5 text-[13.5px] leading-relaxed text-ink outline-none focus:border-copper"
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-copper px-5 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : `Save ${meta.label}`}
        </button>
        {saved ? (
          <span className="flex items-center gap-1 text-[12.5px] font-medium text-success" role="status">
            <Check size={13} aria-hidden /> Saved
          </span>
        ) : null}
        {error ? <span className="text-[12.5px] font-medium text-danger" role="alert">{error}</span> : null}
      </div>
    </div>
  );
}
