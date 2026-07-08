"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles } from "lucide-react";

import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Panel } from "@/components/seller/ui";

type Message = { id: string; role: string; content: string };

export function AiAssistantPanel({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [threadId, setThreadId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    const userMsg = message;
    setMessage("");
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", content: userMsg }]);

    const res = await api(`/api/store/${storeId}/ai/assistant`, {
      method: "POST",
      body: { message: userMsg, threadId },
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const data = res.data as { threadId: string; message: { id: string; content: string } };
    setThreadId(data.threadId);
    setMessages((m) => [
      ...m,
      {
        id: data.message.id,
        role: "assistant",
        content: data.message.content,
      },
    ]);
    router.refresh();
  }

  return (
    <Panel
      title="Business assistant"
      description="Ask about revenue, inventory, customers, and marketing. Answers use live store data."
    >
      {error && <div className="mb-4"><Alert kind="error">{error}</Alert></div>}
      <div className="flex flex-col gap-3 min-h-[320px] max-h-[480px] overflow-y-auto mb-4 p-3 rounded-lg bg-[var(--surface-elevated)]">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
            <Sparkles size={16} /> Try: &quot;How is revenue trending?&quot; or &quot;What should I restock?&quot;
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`text-sm p-3 rounded-lg max-w-[85%] ${
              m.role === "user"
                ? "ml-auto bg-[var(--accent)] text-white"
                : "bg-[var(--surface)] border border-[var(--border)]"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <p className="text-sm text-[var(--text-muted)]">Thinking…</p>}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <Input
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about your store…"
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          <Send size={16} />
        </Button>
      </form>
    </Panel>
  );
}
