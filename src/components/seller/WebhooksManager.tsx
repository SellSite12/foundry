"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/client/api";
import { WEBHOOK_EVENTS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Panel } from "@/components/seller/ui";

type Webhook = {
  id: string;
  url: string;
  events: string;
  active: boolean;
  failureCount: number;
};

export function WebhooksManager({
  storeId,
  webhooks,
  canManage,
}: {
  storeId: string;
  webhooks: Webhook[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await api(`/api/store/${storeId}/webhooks`, {
      method: "POST",
      body: { url, events: [...WEBHOOK_EVENTS.slice(0, 5)] },
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSecret((res.data as { secret: string }).secret);
    setUrl("");
    router.refresh();
  }

  async function remove(id: string) {
    await api(`/api/store/${storeId}/webhooks?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Panel title="Webhooks" description="Outbound event subscriptions with HMAC signing and retries.">
      {secret && (
        <Alert kind="success">
          Webhook created. Signing secret (shown once): <code>{secret}</code>
        </Alert>
      )}
      {error && <div className="mb-4"><Alert kind="error">{error}</Alert></div>}
      {canManage && (
        <form onSubmit={create} className="flex gap-2 mb-4">
          <Input
            label="Webhook URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/webhooks"
            className="flex-1"
            required
          />
          <Button type="submit">Add webhook</Button>
        </form>
      )}
      <ul className="space-y-2">
        {webhooks.map((w) => (
          <li key={w.id} className="flex justify-between items-center text-sm p-2 border border-[var(--border)] rounded">
            <span>{w.url}</span>
            {canManage && (
              <Button variant="ghost" className="!py-1.5 !px-3 !text-xs" onClick={() => remove(w.id)}>Remove</Button>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
