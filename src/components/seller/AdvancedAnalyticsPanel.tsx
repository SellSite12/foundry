"use client";

import { formatMoney } from "@/lib/money";

type Metrics = {
  revenueCents: number;
  revenueChangePct: number | null;
  averageOrderValueCents: number;
  repeatPurchaseRate: number;
  avgLtvCents: number;
  refundRate: number;
  inventoryTurnover: number;
  forecastNext30dCents: number;
  funnel: { visits: number; addToCarts: number; checkouts: number; orders: number };
};

export function AdvancedAnalyticsPanel({
  currency,
  metrics,
}: {
  currency: string;
  metrics: Metrics;
}) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Stat label="Avg order value" value={formatMoney(metrics.averageOrderValueCents, currency)} />
      <Stat label="Repeat purchase rate" value={`${metrics.repeatPurchaseRate.toFixed(1)}%`} />
      <Stat label="Avg customer LTV" value={formatMoney(metrics.avgLtvCents, currency)} />
      <Stat label="Refund rate" value={`${metrics.refundRate.toFixed(1)}%`} />
      <Stat label="Inventory turnover" value={metrics.inventoryTurnover.toFixed(2)} />
      <Stat
        label="30-day forecast"
        value={formatMoney(metrics.forecastNext30dCents, currency)}
      />
      <div className="md:col-span-2 lg:col-span-3 p-4 rounded-lg border border-[var(--border)]">
        <p className="text-sm font-medium mb-2">Conversion funnel</p>
        <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
          <span>Visits: {metrics.funnel.visits}</span>
          <span>Add to cart: {metrics.funnel.addToCarts}</span>
          <span>Checkout: {metrics.funnel.checkouts}</span>
          <span>Orders: {metrics.funnel.orders}</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}
