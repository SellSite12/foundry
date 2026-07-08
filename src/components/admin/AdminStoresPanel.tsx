"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader, Panel, StatusBadge } from "@/components/seller/ui";

type StoreRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  owner: { name: string; email: string };
  orderCount: number;
  productCount: number;
};

export function AdminStoresPanel() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api<{ stores: StoreRow[] }>(`/api/admin/stores?q=${encodeURIComponent(q)}`);
    setLoading(false);
    if (res.ok) setStores(res.data.stores);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function patchStore(id: string, status: string) {
    setBusy(id);
    const res = await api(`/api/admin/stores/${id}`, { method: "PATCH", body: { status } });
    setBusy(null);
    if (res.ok) load();
  }

  return (
    <div>
      <PageHeader title="Stores" description="View all seller stores and pause or archive them." />
      <Panel title="All stores">
        <Input label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or slug…" />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="py-2 pr-4">Store</th>
                <th className="py-2 pr-4">Owner</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Orders</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-6 text-ink-faint">Loading…</td></tr>
              ) : stores.map((s) => (
                <tr key={s.id} className="border-b border-line">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-ink">{s.name}</div>
                    <div className="text-[12px] text-ink-faint">/shop/{s.slug}</div>
                  </td>
                  <td className="py-3 pr-4 text-ink-dim">{s.owner.email}</td>
                  <td className="py-3 pr-4"><StatusBadge status={s.status} /></td>
                  <td className="py-3 pr-4 text-ink-dim">{s.orderCount}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {s.status !== "PAUSED" ? (
                        <Button className="!px-3 !py-1 text-[11px]" variant="secondary" loading={busy === s.id} onClick={() => patchStore(s.id, "PAUSED")}>Pause</Button>
                      ) : (
                        <Button className="!px-3 !py-1 text-[11px]" variant="secondary" loading={busy === s.id} onClick={() => patchStore(s.id, "ACTIVE")}>Activate</Button>
                      )}
                      {s.status !== "ARCHIVED" ? (
                        <Button className="!px-3 !py-1 text-[11px]" variant="danger" loading={busy === s.id} onClick={() => patchStore(s.id, "ARCHIVED")}>Archive</Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
