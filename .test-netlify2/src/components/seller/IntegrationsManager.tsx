"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plug, Unplug } from "lucide-react";

import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/seller/ui";

type Integration = {
  id: string;
  category: string;
  label: string;
  status: string;
  connected: boolean;
};

export function IntegrationsManager({
  storeId,
  integrations,
}: {
  storeId: string;
  integrations: Integration[];
}) {
  const router = useRouter();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");

  async function connect(provider: string) {
    setConnecting(provider);
    await api(`/api/store/${storeId}/integrations`, {
      method: "POST",
      body: { provider, credentials: { apiKey } },
    });
    setConnecting(null);
    setApiKey("");
    router.refresh();
  }

  async function disconnect(provider: string) {
    await api(`/api/store/${storeId}/integrations?provider=${provider}`, { method: "DELETE" });
    router.refresh();
  }

  const grouped = integrations.reduce<Record<string, Integration[]>>((acc, i) => {
    (acc[i.category] ??= []).push(i);
    return acc;
  }, {});

  return (
    <div className="grid gap-4">
      {Object.entries(grouped).map(([category, items]) => (
        <Panel key={category} title={category}>
          <div className="grid gap-3">
            {items.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)]"
              >
                <div>
                  <p className="font-medium">{i.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{i.status}</p>
                </div>
                {i.connected ? (
                  <Button variant="ghost" className="!py-1.5 !px-3 !text-xs" onClick={() => disconnect(i.id)}>
                    <Unplug size={14} className="mr-1" /> Disconnect
                  </Button>
                ) : (
                  <div className="flex gap-2 items-center">
                    <Input
                      label="API key"
                      placeholder="API key"
                      value={connecting === i.id ? apiKey : ""}
                      onChange={(e) => {
                        setConnecting(i.id);
                        setApiKey(e.target.value);
                      }}
                      className="w-40"
                    />
                    <Button className="!py-1.5 !px-3 !text-xs" onClick={() => connect(i.id)} disabled={!apiKey}>
                      <Plug size={14} className="mr-1" /> Connect
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}
