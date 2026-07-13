"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Receipt } from "lucide-react";

import { api } from "@/lib/client/api";
import { formatMoney } from "@/lib/money";
import type { PlanDefinition } from "@/lib/plans";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Panel, StatCard, StatusBadge } from "@/components/seller/ui";

type Subscription = {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
};
type Usage = {
  products: number;
  ordersThisMonth: number;
  teamSeats: number;
  storageBytes: number;
};
type HistoryEvent = { id: string; type: string; payload: string | null; createdAt: string };

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function BillingManager({
  storeId,
  isOwner,
  subscription,
  usage,
  plans,
  history,
}: {
  storeId: string;
  isOwner: boolean;
  subscription: Subscription | null;
  usage: Usage;
  plans: PlanDefinition[];
  history: HistoryEvent[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPlan = subscription?.plan ?? "STARTER";
  const active = subscription?.status === "ACTIVE";

  async function act(body: Record<string, unknown>, key: string) {
    setBusy(key);
    setError(null);
    const res = await api(`/api/store/${storeId}/billing`, { method: "POST", body });
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {error && <Alert kind="error">{error}</Alert>}

      {/* current plan + usage */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Current plan"
          value={
            <span className="flex items-center gap-2">
              {plans.find((p) => p.id === currentPlan)?.name ?? currentPlan}
              {subscription && <StatusBadge status={subscription.status} />}
            </span>
          }
          sub={
            subscription?.canceledAt
              ? "Canceled — resume anytime"
              : subscription?.currentPeriodEnd
                ? `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US")}`
                : "Free plan"
          }
        />
        <StatCard label="Products" value={usage.products} />
        <StatCard label="Orders this month" value={usage.ordersThisMonth} />
        <StatCard
          label="Storage used"
          value={formatBytes(usage.storageBytes)}
          sub={`${usage.teamSeats} team seat${usage.teamSeats === 1 ? "" : "s"}`}
        />
      </div>

      {/* plans */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan && active;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 ${
                isCurrent ? "border-copper bg-copper-soft/40" : "border-line bg-surface"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="fdy-display text-[16px] font-semibold text-ink">{plan.name}</h3>
                {isCurrent && (
                  <span className="fdy-mono rounded-full bg-copper px-2.5 py-1 text-[9.5px] font-bold text-black">
                    CURRENT
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12.5px] text-ink-faint">{plan.blurb}</p>
              <div className="fdy-mono mt-4 text-[24px] font-semibold text-ink">
                {plan.monthlyCents === 0 ? "Free" : formatMoney(plan.monthlyCents)}
                {plan.monthlyCents > 0 && (
                  <span className="text-[12px] font-normal text-ink-faint">/mo</span>
                )}
              </div>
              <ul className="mt-4 flex flex-col gap-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[12.5px] text-ink-dim">
                    <Check size={13} className="shrink-0 text-copper" /> {f}
                  </li>
                ))}
              </ul>
              {isOwner && !isCurrent && (
                <div className="mt-5">
                  <Button
                    variant={plan.id === "STARTER" ? "secondary" : "primary"}
                    onClick={() => act({ action: "change_plan", plan: plan.id }, plan.id)}
                    loading={busy === plan.id}
                    full
                  >
                    {plans.findIndex((p) => p.id === plan.id) <
                    plans.findIndex((p) => p.id === currentPlan)
                      ? "Downgrade"
                      : "Upgrade"}{" "}
                    to {plan.name}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isOwner && subscription && (
        <div>
          {active && !subscription.canceledAt ? (
            <Button
              variant="ghost"
              onClick={() => {
                if (confirm("Cancel your subscription? You'll keep access until the period ends.")) {
                  act({ action: "cancel" }, "cancel");
                }
              }}
              loading={busy === "cancel"}
            >
              <span className="text-danger">Cancel subscription</span>
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => act({ action: "resume" }, "resume")}
              loading={busy === "resume"}
            >
              Resume subscription
            </Button>
          )}
        </div>
      )}

      {/* invoices + history */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Invoices">
          <div className="flex flex-col items-center py-6 text-center">
            <Receipt size={18} className="mb-2 text-ink-faint" />
            <p className="max-w-xs text-[13px] text-ink-faint">
              No invoices yet — they&apos;re generated when paid-plan payment collection
              launches with Phase 4 checkout.
            </p>
          </div>
        </Panel>

        <Panel title="Billing history">
          {history.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-faint">
              Plan changes and cancellations appear here.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {history.map((h) => {
                let detail = "";
                try {
                  const p = h.payload ? JSON.parse(h.payload) : {};
                  detail =
                    h.type === "billing.plan_changed"
                      ? `${p.from ?? "?"} → ${p.to ?? "?"}`
                      : `was ${p.plan ?? "?"}`;
                } catch {
                  // ignore
                }
                return (
                  <div key={h.id} className="flex items-center justify-between text-[12.5px]">
                    <span className="text-ink">
                      {h.type === "billing.plan_changed" ? "Plan changed" : "Subscription canceled"}
                      <span className="fdy-mono ml-2 text-ink-faint">{detail}</span>
                    </span>
                    <span className="text-ink-faint">
                      {new Date(h.createdAt).toLocaleDateString("en-US")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
