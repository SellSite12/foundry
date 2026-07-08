"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader, Panel, StatusBadge } from "@/components/seller/ui";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  storeCount: number;
  orderCount: number;
  createdAt: string;
};

export function AdminUsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api<{ users: UserRow[] }>(`/api/admin/users?q=${encodeURIComponent(q)}`);
    setLoading(false);
    if (res.ok) setUsers(res.data.users);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function patchUser(id: string, data: { role?: string; status?: string }) {
    setBusy(id);
    const res = await api(`/api/admin/users/${id}`, { method: "PATCH", body: data });
    setBusy(null);
    if (res.ok) load();
  }

  return (
    <div>
      <PageHeader title="Users" description="Search accounts, change roles, suspend access." />
      <Panel title="All users">
        <Input label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Email or name…" />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Stores</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-6 text-ink-faint">Loading…</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-b border-line">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-ink">{u.name}</div>
                    <div className="text-[12px] text-ink-faint">{u.email}</div>
                  </td>
                  <td className="py-3 pr-4"><StatusBadge status={u.role} /></td>
                  <td className="py-3 pr-4"><StatusBadge status={u.status} /></td>
                  <td className="py-3 pr-4 text-ink-dim">{u.storeCount}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {u.role === "USER" ? (
                        <Button className="!px-3 !py-1 text-[11px]" variant="secondary" loading={busy === u.id} onClick={() => patchUser(u.id, { role: "ADMIN" })}>
                          Make admin
                        </Button>
                      ) : (
                        <Button className="!px-3 !py-1 text-[11px]" variant="secondary" loading={busy === u.id} onClick={() => patchUser(u.id, { role: "USER" })}>
                          Remove admin
                        </Button>
                      )}
                      {u.status === "ACTIVE" ? (
                        <Button className="!px-3 !py-1 text-[11px]" variant="danger" loading={busy === u.id} onClick={() => patchUser(u.id, { status: "SUSPENDED" })}>
                          Suspend
                        </Button>
                      ) : (
                        <Button className="!px-3 !py-1 text-[11px]" variant="secondary" loading={busy === u.id} onClick={() => patchUser(u.id, { status: "ACTIVE" })}>
                          Reactivate
                        </Button>
                      )}
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
