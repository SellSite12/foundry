"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy, Trash2, KeyRound, Check } from "lucide-react";

import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Panel, Modal, EmptyState } from "@/components/seller/ui";

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  scopes: string;
  lastUsedAt: string | null;
  createdAt: string;
};

export function ApiKeysManager({
  storeId,
  canManage,
  keys,
}: {
  storeId: string;
  canManage: boolean;
  keys: ApiKey[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState("read");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await api<{ rawKey: string }>(`/api/store/${storeId}/apikeys`, {
      method: "POST",
      body: { name, scopes },
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setRawKey(res.data.rawKey);
    setName("");
    router.refresh();
  }

  async function revoke(key: ApiKey) {
    if (!confirm(`Revoke API key "${key.name}"? Apps using it will stop working.`)) return;
    await api(`/api/store/${storeId}/apikeys?id=${key.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function copy() {
    if (!rawKey) return;
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setOpen(true)}>
            <Plus size={14} /> Create API key
          </Button>
        </div>
      )}

      {keys.length === 0 ? (
        <EmptyState
          icon={<KeyRound size={20} />}
          title="No API keys"
          body="Create a key to access your store's data programmatically. Only the SHA-256 hash is stored — the key is shown once."
          action={
            canManage ? (
              <Button onClick={() => setOpen(true)}>
                <Plus size={14} /> Create your first key
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Panel>
          <div className="flex flex-col">
            {keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between border-b border-line py-3.5 last:border-0"
              >
                <div>
                  <div className="text-[13.5px] font-medium text-ink">{k.name}</div>
                  <div className="fdy-mono mt-0.5 text-[11.5px] text-ink-faint">
                    {k.prefix}…{" · "}
                    {k.scopes === "read_write" ? "Read & write" : "Read only"}
                    {" · "}
                    {k.lastUsedAt
                      ? `last used ${new Date(k.lastUsedAt).toLocaleDateString("en-US")}`
                      : "never used"}
                  </div>
                </div>
                {canManage && (
                  <button
                    onClick={() => revoke(k)}
                    className="rounded-lg p-1.5 text-ink-faint hover:text-danger"
                    aria-label="Revoke key"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setRawKey(null);
        }}
        title={rawKey ? "API key created" : "Create API key"}
      >
        {rawKey ? (
          <div className="flex flex-col gap-4">
            <Alert kind="info">
              Copy this key now — it won&apos;t be shown again.
            </Alert>
            <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-base2 p-3">
              <code className="fdy-mono flex-1 break-all text-[11.5px] text-copper">{rawKey}</code>
              <button
                onClick={copy}
                className="shrink-0 rounded-lg p-2 text-ink-dim hover:bg-hover hover:text-ink"
                aria-label="Copy key"
              >
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              </button>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false);
                setRawKey(null);
              }}
              full
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={create} className="flex flex-col gap-4" noValidate>
            {error && <Alert kind="error">{error}</Alert>}
            <Input
              label="Key name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Zapier integration"
              required
              autoFocus
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-ink-dim">Scopes</label>
              <select
                value={scopes}
                onChange={(e) => setScopes(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none"
              >
                <option value="read">Read only</option>
                <option value="read_write">Read & write</option>
              </select>
            </div>
            <Button type="submit" loading={saving} full>
              Create key
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
