"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Check } from "lucide-react";

import { api } from "@/lib/client/api";
import { AI_DRAFT_KINDS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/seller/ui";

type Draft = {
  id: string;
  kind: string;
  content: string;
  status: string;
  createdAt: string;
};

export function AiDraftsPanel({
  storeId,
  drafts,
}: {
  storeId: string;
  drafts: Draft[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState<string>(AI_DRAFT_KINDS[0]);
  const [prompt, setPrompt] = useState("");

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    await api(`/api/store/${storeId}/ai/drafts`, {
      method: "POST",
      body: { kind, prompt },
    });
    setPrompt("");
    router.refresh();
  }

  async function publish(id: string) {
    await api(`/api/store/${storeId}/ai/drafts`, { method: "PATCH", body: { id } });
    router.refresh();
  }

  async function discard(id: string) {
    await api(`/api/store/${storeId}/ai/drafts?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <Panel title="Generate content" description="All AI content requires review before publishing.">
        <form onSubmit={generate} className="flex flex-wrap gap-3">
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
            {AI_DRAFT_KINDS.map((k) => (
              <option key={k} value={k}>{k.replace(/_/g, " ")}</option>
            ))}
          </select>
          <Input
            label="Instructions"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Optional instructions…"
            className="flex-1 min-w-[200px]"
          />
          <Button type="submit"><Sparkles size={16} className="mr-1" /> Generate</Button>
        </form>
      </Panel>

      {drafts.map((d) => (
        <Panel key={d.id} title={d.kind.replace(/_/g, " ")}>
          <pre className="text-sm whitespace-pre-wrap mb-3 p-3 bg-[var(--surface-elevated)] rounded">
            {d.content}
          </pre>
          <div className="flex gap-2">
            <Button className="!py-1.5 !px-3 !text-xs" onClick={() => publish(d.id)}>
              <Check size={14} className="mr-1" /> Publish
            </Button>
            <Button variant="ghost" className="!py-1.5 !px-3 !text-xs" onClick={() => discard(d.id)}>Discard</Button>
          </div>
        </Panel>
      ))}
    </div>
  );
}
