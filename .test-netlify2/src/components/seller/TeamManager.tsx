"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Crown, Trash2 } from "lucide-react";

import { api } from "@/lib/client/api";
import { TEAM_ROLES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Panel, Modal, StatusBadge } from "@/components/seller/ui";

type Member = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  createdAt: string;
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN: "Full access except deleting the store",
  MANAGER: "Products, orders, customers, marketing — no team or billing",
  SUPPORT: "Orders, customers, reviews, and inbox",
  WAREHOUSE: "Orders, inventory, and product stock",
};

export function TeamManager({
  storeId,
  canManage,
  owner,
  members,
}: {
  storeId: string;
  canManage: boolean;
  owner: { name: string; email: string } | null;
  members: Member[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SUPPORT");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    const res = await api(`/api/store/${storeId}/team`, {
      method: "POST",
      body: { email, role },
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.fieldErrors ? null : res.error);
      setFieldErrors(res.fieldErrors ?? {});
      return;
    }
    setOpen(false);
    setEmail("");
    router.refresh();
  }

  async function changeRole(member: Member, newRole: string) {
    await api(`/api/store/${storeId}/team?id=${member.id}`, {
      method: "PATCH",
      body: { role: newRole },
    });
    router.refresh();
  }

  async function remove(member: Member) {
    if (!confirm(`Remove ${member.name ?? member.email} from the team?`)) return;
    await api(`/api/store/${storeId}/team?id=${member.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setOpen(true)}>
            <Plus size={14} /> Invite member
          </Button>
        </div>
      )}

      <Panel>
        <div className="flex flex-col">
          {/* owner row */}
          {owner && (
            <div className="flex items-center justify-between border-b border-line py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-copper-soft text-copper">
                  <Crown size={15} />
                </div>
                <div>
                  <div className="text-[13.5px] font-medium text-ink">{owner.name}</div>
                  <div className="text-[11.5px] text-ink-faint">{owner.email}</div>
                </div>
              </div>
              <span className="fdy-mono rounded-full bg-copper-soft px-2.5 py-1 text-[10px] font-semibold text-copper">
                OWNER
              </span>
            </div>
          )}

          {members.length === 0 && (
            <p className="py-6 text-center text-[13px] text-ink-faint">
              No team members yet. Invite staff to help run the store.
            </p>
          )}

          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between border-b border-line py-3.5 last:border-0"
            >
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-medium text-ink">
                  {m.name ?? m.email}
                </div>
                <div className="text-[11.5px] text-ink-faint">{m.email}</div>
              </div>
              <div className="flex items-center gap-2.5">
                <StatusBadge status={m.status} />
                {canManage ? (
                  <>
                    <select
                      value={m.role}
                      onChange={(e) => changeRole(m, e.target.value)}
                      className="rounded-full border border-line bg-surface px-2.5 py-1.5 text-[11.5px] text-ink-dim outline-none"
                      aria-label="Role"
                    >
                      {TEAM_ROLES.filter((r) => r !== "OWNER").map((r) => (
                        <option key={r} value={r}>
                          {r[0] + r.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => remove(m)}
                      className="rounded-lg p-1.5 text-ink-faint hover:text-danger"
                      aria-label="Remove member"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : (
                  <span className="fdy-mono rounded-full bg-hover px-2.5 py-1 text-[10px] text-ink-faint">
                    {m.role}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.entries(ROLE_DESCRIPTIONS).map(([r, desc]) => (
          <div key={r} className="rounded-xl border border-line bg-surface p-4">
            <div className="fdy-mono text-[11px] font-semibold text-copper">{r}</div>
            <p className="mt-1 text-[12.5px] text-ink-dim">{desc}</p>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Invite team member">
        <form onSubmit={invite} className="flex flex-col gap-4" noValidate>
          {error && <Alert kind="error">{error}</Alert>}
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            required
            autoFocus
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-medium text-ink-dim">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none"
            >
              {TEAM_ROLES.filter((r) => r !== "OWNER").map((r) => (
                <option key={r} value={r}>
                  {r[0] + r.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <span className="text-[11.5px] text-ink-faint">{ROLE_DESCRIPTIONS[role]}</span>
          </div>
          <Button type="submit" loading={saving} full>
            Send invite
          </Button>
        </form>
      </Modal>
    </div>
  );
}
