"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { api } from "@/lib/client/api";
import { formatMoney } from "@/lib/money";

type Suggestions = {
  products: { name: string; href: string; priceCents: number; currency: string; imageUrl: string | null }[];
  sellers: { name: string; href: string; logo: string | null; industry: string | null }[];
  categories: { name: string; href: string; count: number }[];
};

/** Marketplace search box with debounced autocomplete. */
export function MarketplaceSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function onChange(value: string) {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setSuggestions(null);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      const res = await api<Suggestions>(
        `/api/marketplace/search?mode=suggest&q=${encodeURIComponent(value.trim())}`
      );
      if (res.ok) {
        setSuggestions(res.data);
        setOpen(true);
      }
    }, 200);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    router.push(`/marketplace/search?q=${encodeURIComponent(q.trim())}`);
  }

  const hasResults =
    suggestions &&
    (suggestions.products.length > 0 || suggestions.sellers.length > 0 || suggestions.categories.length > 0);

  return (
    <div ref={boxRef} className="relative w-full max-w-xl">
      <form onSubmit={submit} role="search" aria-label="Search the marketplace">
        <div className="relative">
          <Search size={17} aria-hidden className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-dim" />
          <input
            value={q}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => hasResults && setOpen(true)}
            placeholder="Search products, sellers, categories…"
            aria-label="Search"
            aria-expanded={open}
            aria-autocomplete="list"
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-4 text-[14px] text-ink outline-none transition-colors focus:border-copper"
          />
        </div>
      </form>

      {open && hasResults ? (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl"
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions!.products.length > 0 ? (
            <div className="p-2">
              <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-dim">Products</p>
              {suggestions!.products.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-hover"
                >
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-hover">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="flex-1 truncate text-[13.5px] text-ink">{p.name}</span>
                  <span className="text-[13px] font-medium text-ink-dim">{formatMoney(p.priceCents, p.currency)}</span>
                </Link>
              ))}
            </div>
          ) : null}
          {suggestions!.sellers.length > 0 ? (
            <div className="border-t border-line p-2">
              <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-dim">Sellers</p>
              {suggestions!.sellers.map((s) => (
                <Link key={s.href} href={s.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-hover">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-copper/15 text-[13px] font-bold text-copper">
                    {s.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      s.name.charAt(0)
                    )}
                  </span>
                  <span className="flex-1 truncate text-[13.5px] text-ink">{s.name}</span>
                  {s.industry ? <span className="text-[12px] text-ink-dim">{s.industry}</span> : null}
                </Link>
              ))}
            </div>
          ) : null}
          {suggestions!.categories.length > 0 ? (
            <div className="border-t border-line p-2">
              <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-dim">Categories</p>
              {suggestions!.categories.map((c) => (
                <Link key={c.href} href={c.href} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[13.5px] text-ink hover:bg-hover">
                  <span>{c.name}</span>
                  <span className="text-[12px] text-ink-dim">{c.count}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
