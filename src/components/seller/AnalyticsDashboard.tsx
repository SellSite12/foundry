"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { formatMoney, formatNumber, formatPercent } from "@/lib/money";
import { StatCard, Panel } from "@/components/seller/ui";

type Analytics = {
  range: { from: string; to: string };
  totals: {
    revenueCents: number;
    orders: number;
    paidOrders: number;
    unitsSold: number;
    visitors: number;
    conversionRate: number | null;
    averageOrderCents: number;
    returningCustomers: number;
  };
  series: { date: string; revenueCents: number; orders: number; visitors: number }[];
  topProducts: { productId: string; name: string; units: number; revenueCents: number }[];
  sources: { key: string; count: number }[];
  devices: { key: string; count: number }[];
  countries: { key: string; count: number }[];
  topPages: { key: string; count: number }[];
  funnel: { visitors: number; orders: number; paid: number };
};

const RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "year", label: "Year" },
];

const AXIS = { fontSize: 10.5, fill: "var(--fdy-text-faint)" };

export function AnalyticsDashboard({
  currency,
  analytics,
  rangeKey,
  customFrom,
  customTo,
}: {
  currency: string;
  analytics: Analytics;
  rangeKey: string;
  customFrom: string;
  customTo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [from, setFrom] = useState(customFrom);
  const [to, setTo] = useState(customTo);
  const t = analytics.totals;

  const chartData = analytics.series.map((d) => ({
    date: d.date.slice(5),
    revenue: d.revenueCents / 100,
    orders: d.orders,
    visitors: d.visitors,
  }));

  const hasVisits = t.visitors > 0;

  return (
    <div>
      {/* date filters */}
      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => router.push(`${pathname}?range=${r.key}`)}
            className={`rounded-full px-3.5 py-1.5 text-[12px] transition-colors ${
              rangeKey === r.key
                ? "bg-copper-soft font-medium text-copper"
                : "text-ink-faint hover:text-ink"
            }`}
          >
            {r.label}
          </button>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (from && to) router.push(`${pathname}?range=custom&from=${from}&to=${to}`);
          }}
          className="ml-2 flex items-center gap-1.5"
        >
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-line bg-surface px-2 py-1 text-[11.5px] text-ink-dim outline-none"
            aria-label="From date"
          />
          <span className="text-[11px] text-ink-faint">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-line bg-surface px-2 py-1 text-[11.5px] text-ink-dim outline-none"
            aria-label="To date"
          />
          <button
            type="submit"
            className={`rounded-full px-3 py-1.5 text-[11.5px] ${
              rangeKey === "custom"
                ? "bg-copper-soft font-medium text-copper"
                : "border border-line-strong text-ink-dim hover:text-ink"
            }`}
          >
            Apply
          </button>
        </form>
      </div>

      {/* headline totals */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatMoney(t.revenueCents, currency)} />
        <StatCard label="Orders" value={formatNumber(t.orders)} sub={`${t.paidOrders} paid`} />
        <StatCard label="Products sold" value={formatNumber(t.unitsSold)} />
        <StatCard
          label="Average order value"
          value={t.paidOrders ? formatMoney(t.averageOrderCents, currency) : "—"}
        />
      </div>
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Visitors"
          value={formatNumber(t.visitors)}
          sub={!hasVisits ? "Storefront traffic lands here in Phase 4" : undefined}
        />
        <StatCard
          label="Conversion rate"
          value={t.conversionRate === null ? "—" : formatPercent(t.conversionRate)}
          sub={t.conversionRate === null ? "Needs visitor data" : undefined}
        />
        <StatCard label="Returning customers" value={formatNumber(t.returningCustomers)} />
        <StatCard
          label="Sales funnel"
          value={`${formatNumber(analytics.funnel.visitors)} → ${formatNumber(analytics.funnel.orders)} → ${formatNumber(analytics.funnel.paid)}`}
          sub="Visitors → orders → paid"
        />
      </div>

      {/* charts */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Revenue">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--fdy-copper)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--fdy-copper)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--fdy-line)" vertical={false} />
                <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--fdy-surface)",
                    border: "1px solid var(--fdy-line-strong)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--fdy-text)",
                  }}
                  formatter={(v) => [
                    formatMoney(Math.round(Number(v ?? 0) * 100), currency),
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--fdy-copper)"
                  strokeWidth={2}
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Orders & visitors">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--fdy-line)" vertical={false} />
                <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--fdy-surface)",
                    border: "1px solid var(--fdy-line-strong)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--fdy-text)",
                  }}
                />
                <Bar dataKey="orders" fill="var(--fdy-copper)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="visitors" fill="var(--fdy-copper-soft)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title="Top products">
          {analytics.topProducts.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-ink-faint">
              No paid orders in this period.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {analytics.topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3 text-[13px]">
                  <span className="fdy-mono w-5 text-ink-faint">{i + 1}.</span>
                  <span className="flex-1 truncate text-ink">{p.name}</span>
                  <span className="text-ink-faint">{p.units} sold</span>
                  <span className="fdy-mono w-24 text-right text-ink">
                    {formatMoney(p.revenueCents, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <DimensionPanel title="Traffic sources" rows={analytics.sources} empty="Traffic source data arrives with the Phase 4 storefront." />
        <DimensionPanel title="Devices" rows={analytics.devices} empty="Device analytics arrive with the Phase 4 storefront." />
        <DimensionPanel title="Geography" rows={analytics.countries} empty="Geographic sales data arrives with the Phase 4 storefront." />
        <DimensionPanel title="Top pages" rows={analytics.topPages} empty="Page view analytics arrive with the Phase 4 storefront." />
      </div>
    </div>
  );
}

function DimensionPanel({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { key: string; count: number }[];
  empty: string;
}) {
  const max = rows.length ? rows[0].count : 0;
  return (
    <Panel title={title}>
      {rows.length === 0 ? (
        <p className="py-4 text-center text-[13px] text-ink-faint">{empty}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center gap-3 text-[12.5px]">
              <span className="w-28 truncate text-ink">{r.key}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-hover">
                <div
                  className="h-full rounded-full bg-copper"
                  style={{ width: `${max ? (r.count / max) * 100 : 0}%` }}
                />
              </div>
              <span className="fdy-mono w-10 text-right text-ink-dim">{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
