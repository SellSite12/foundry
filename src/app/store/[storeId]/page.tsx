import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  ArrowRight,
  Bell,
  Plus,
} from "lucide-react";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { computeHomeMetrics } from "@/lib/seller/metrics";
import { formatMoney, formatNumber, formatPercent } from "@/lib/money";
import { PageHeader, StatCard, Panel, EmptyState, StatusBadge } from "@/components/seller/ui";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Seller dashboard" };

export default async function SellerHomePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId);
  if (!access) notFound();
  const { store, user } = access;

  const [metrics, topProductsRaw, recentOrders, recentActivity, notifications] =
    await Promise.all([
      computeHomeMetrics(storeId),
      db.orderItem.groupBy({
        by: ["productId", "productName"],
        where: { order: { storeId, paidAt: { not: null } } },
        _sum: { quantity: true, unitPriceCents: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      db.order.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { _count: { select: { items: true } } },
      }),
      db.analyticsEvent.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      db.notification.findMany({
        where: { userId: user.id, readAt: null },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
    ]);

  const base = `/store/${storeId}`;
  const hasAnyData = metrics.orders > 0 || metrics.products > 0;

  return (
    <div>
      <PageHeader
        title={store.name}
        description={`Welcome back, ${user.name.split(" ")[0]} — here's how your business is doing.`}
        actions={
          <>
            <Link href={`${base}/products/new`}>
              <Button variant="secondary">
                <Plus size={14} /> Add product
              </Button>
            </Link>
            <Link href={`${base}/orders`}>
              <Button>
                View orders <ArrowRight size={14} />
              </Button>
            </Link>
          </>
        }
      />

      {/* headline metrics — all live queries */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={formatMoney(metrics.revenueCents, store.currency)}
          sub={`${formatNumber(metrics.orders)} orders all-time`}
          icon={<DollarSign size={15} className="text-copper" />}
        />
        <StatCard
          label="Orders"
          value={formatNumber(metrics.orders)}
          sub={`${metrics.salesToday.count} today`}
          icon={<ShoppingCart size={15} className="text-copper" />}
        />
        <StatCard
          label="Customers"
          value={formatNumber(metrics.customers)}
          sub={`${metrics.returningCustomers} returning`}
          icon={<Users size={15} className="text-copper" />}
        />
        <StatCard
          label="Products"
          value={formatNumber(metrics.products)}
          sub={`${metrics.publishedProducts} published`}
          icon={<Package size={15} className="text-copper" />}
        />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Sales today"
          value={formatMoney(metrics.salesToday.cents, store.currency)}
          sub={`${metrics.salesToday.count} paid orders`}
        />
        <StatCard
          label="Sales this week"
          value={formatMoney(metrics.salesWeek.cents, store.currency)}
          sub={`${metrics.salesWeek.count} paid orders`}
        />
        <StatCard
          label="Sales this month"
          value={formatMoney(metrics.salesMonth.cents, store.currency)}
          sub={`${metrics.salesMonth.count} paid orders`}
        />
        <StatCard
          label="Conversion rate"
          value={
            metrics.conversionRate === null
              ? "—"
              : formatPercent(metrics.conversionRate)
          }
          sub={
            metrics.conversionRate === null
              ? "Measured once your storefront gets visits (Phase 4)"
              : `${formatNumber(metrics.visitors)} visitors`
          }
          icon={<TrendingUp size={15} className="text-copper" />}
        />
      </div>

      {!hasAnyData && (
        <div className="mb-5">
          <EmptyState
            icon={<Package size={20} />}
            title="Your dashboard is ready"
            body="Add your first product and create your first order to see live metrics here. Nothing on this page is simulated — every number comes from your database."
            action={
              <Link href={`${base}/products/new`}>
                <Button>
                  <Plus size={14} /> Add your first product
                </Button>
              </Link>
            }
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent orders */}
        <Panel
          title="Recent orders"
          className="lg:col-span-2"
          actions={
            <Link href={`${base}/orders`} className="text-[12px] text-copper hover:underline">
              View all
            </Link>
          }
        >
          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-faint">
              No orders yet. Create one manually from the Orders page or wait for
              storefront checkout in Phase 4.
            </p>
          ) : (
            <div className="flex flex-col">
              {recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`${base}/orders/${o.id}`}
                  className="flex items-center justify-between border-b border-line py-3 last:border-0 hover:bg-hover"
                >
                  <div>
                    <span className="fdy-mono text-[13px] font-semibold text-ink">
                      #{o.orderNumber}
                    </span>
                    <span className="ml-3 text-[12.5px] text-ink-faint">
                      {o.customerEmail} · {o._count.items} item{o._count.items === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="fdy-mono text-[13px] text-ink">
                      {formatMoney(o.totalCents, o.currency)}
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        {/* Top products */}
        <Panel title="Top products">
          {topProductsRaw.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-faint">
              Best sellers appear here after your first paid order.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {topProductsRaw.map((p, i) => (
                <Link
                  key={p.productId}
                  href={`${base}/products/${p.productId}`}
                  className="flex items-center gap-3 hover:opacity-80"
                >
                  <span className="fdy-mono w-5 text-[12px] text-ink-faint">{i + 1}.</span>
                  <span className="flex-1 truncate text-[13px] text-ink">{p.productName}</span>
                  <span className="fdy-mono text-[12px] text-ink-dim">
                    {p._sum.quantity ?? 0} sold
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        {/* Recent activity */}
        <Panel title="Recent activity" className="lg:col-span-2">
          {recentActivity.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-faint">
              Store events (orders, refunds, plan changes) will appear here.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recentActivity.map((e) => (
                <div key={e.id} className="flex items-center gap-3 text-[12.5px]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                  <span className="fdy-mono text-ink-dim">{e.type}</span>
                  <span className="ml-auto shrink-0 text-ink-faint">
                    {e.createdAt.toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Notifications */}
        <Panel
          title="Notifications"
          actions={
            <Link
              href="/dashboard/notifications"
              className="text-[12px] text-copper hover:underline"
            >
              View all
            </Link>
          }
        >
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Bell size={18} className="mb-2 text-ink-faint" />
              <p className="text-[13px] text-ink-faint">You&apos;re all caught up.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.href ?? "/dashboard/notifications"}
                  className="block hover:opacity-80"
                >
                  <div className="text-[13px] font-medium text-ink">{n.title}</div>
                  {n.body && (
                    <div className="mt-0.5 line-clamp-1 text-[12px] text-ink-faint">
                      {n.body}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
