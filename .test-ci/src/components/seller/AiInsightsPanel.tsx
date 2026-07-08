"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, X, Check } from "lucide-react";

import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Panel } from "@/components/seller/ui";

type Insight = {
  id: string;
  kind: string;
  title: string;
  body: string;
  explanation: string;
  priority: string;
  status: string;
  createdAt: string;
};

export function AiInsightsPanel({
  storeId,
  insights: initial,
}: {
  storeId: string;
  insights: Insight[];
}) {
  const router = useRouter();
  const [insights, setInsights] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    const res = await api(`/api/store/${storeId}/ai/insights`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
    const list = await api(`/api/store/${storeId}/ai/insights`);
    if (list.ok) setInsights((list.data as { insights: Insight[] }).insights);
  }

  async function dismiss(id: string) {
    await api(`/api/store/${storeId}/ai/insights?id=${id}&status=DISMISSED`, { method: "PATCH" });
    setInsights((items) => items.filter((i) => i.id !== id));
  }

  async function acted(id: string) {
    await api(`/api/store/${storeId}/ai/insights?id=${id}&status=ACTED`, { method: "PATCH" });
    setInsights((items) => items.filter((i) => i.id !== id));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-[var(--text-muted)]">
          Recommendations computed from live orders, inventory, and customer data.
        </p>
        <Button variant="secondary" onClick={refresh} disabled={loading}>
          <RefreshCw size={16} className="mr-2" />
          Refresh insights
        </Button>
      </div>
      {error && <div className="mb-4"><Alert kind="error">{error}</Alert></div>}
      {insights.length === 0 ? (
        <Panel title="No insights yet">
          <p className="text-sm text-[var(--text-muted)]">
            Click refresh to analyze your store and generate recommendations.
          </p>
        </Panel>
      ) : (
        <div className="grid gap-4">
          {insights.map((ins) => (
            <Panel
              key={ins.id}
              title={ins.title}
              description={`${ins.kind.replace(/_/g, " ")} · ${ins.priority} priority`}
            >
              <p className="text-sm mb-2">{ins.body}</p>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                <strong>Why:</strong> {ins.explanation}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" className="!py-1.5 !px-3 !text-xs" onClick={() => acted(ins.id)}>
                  <Check size={14} className="mr-1" /> Mark acted
                </Button>
                <Button variant="ghost" className="!py-1.5 !px-3 !text-xs" onClick={() => dismiss(ins.id)}>
                  <X size={14} className="mr-1" /> Dismiss
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
