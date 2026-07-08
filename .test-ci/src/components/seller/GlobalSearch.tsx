"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

import { api } from "@/lib/client/api";

type Result = { group: string; label: string; detail: string; href: string };

export function GlobalSearch({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cmd/Ctrl+K opens search.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await api<{ results: Result[] }>(
        `/api/store/${storeId}/search?q=${encodeURIComponent(q.trim())}`
      );
      if (res.ok) setResults(res.data.results);
      setLoading(false);
    }, 200);
  }, [q, storeId]);

  function go(href: string) {
    setOpen(false);
    setQ("");
    router.push(href);
  }

  const grouped = results.reduce<Record<string, Result[]>>((acc, r) => {
    (acc[r.group] ??= []).push(r);
    return acc;
  }, {});

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-line bg-base2 px-3.5 py-2 text-[12.5px] text-ink-faint transition-colors hover:border-line-strong hover:text-ink-dim"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="fdy-mono hidden rounded bg-hover px-1.5 py-0.5 text-[9.5px] sm:inline">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="fdy-pop relative w-full max-w-lg overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-[0_40px_100px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              {loading ? (
                <Loader2 size={16} className="animate-spin text-copper" />
              ) : (
                <Search size={16} className="text-ink-faint" />
              )}
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products, orders, customers, files, settings…"
                className="flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
              />
            </div>
            <div className="fdy-scrollbar max-h-[50vh] overflow-y-auto p-2">
              {q.trim().length >= 2 && !loading && results.length === 0 && (
                <p className="px-3 py-6 text-center text-[13px] text-ink-faint">
                  No matches for “{q.trim()}”.
                </p>
              )}
              {Object.entries(grouped).map(([group, items]) => (
                <div key={group} className="mb-1.5">
                  <div className="px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-faint">
                    {group}
                  </div>
                  {items.map((r) => (
                    <button
                      key={r.href + r.label}
                      onClick={() => go(r.href)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-hover"
                    >
                      <span className="text-[13.5px] text-ink">{r.label}</span>
                      <span className="ml-3 truncate text-[11.5px] text-ink-faint">
                        {r.detail}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
