import Link from "next/link";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Orders" };

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-ink-dim",
  PAID: "text-copper",
  PROCESSING: "text-copper",
  PACKED: "text-copper",
  SHIPPED: "text-copper",
  DELIVERED: "text-success",
  CANCELLED: "text-danger",
  REFUNDED: "text-danger",
};

export default async function AccountOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireUser();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const take = 10;

  const where = {
    OR: [{ customerId: user.id }, { customerEmail: user.email.toLowerCase() }],
  };
  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip: (page - 1) * take,
      include: {
        store: { select: { name: true, slug: true } },
        items: { select: { productName: true, quantity: true } },
      },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / take));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Order history</h1>
      <p className="mt-1 text-[13.5px] text-ink-dim">
        {total} order{total === 1 ? "" : "s"} across all stores
      </p>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-line px-6 py-16 text-center">
          <p className="text-[15px] font-semibold">No orders yet</p>
          <p className="mt-1 text-[13.5px] text-ink-dim">
            When you buy from a Foundry store, your orders appear here.
          </p>
          <Link
            href="/marketplace"
            className="mt-6 inline-flex rounded-xl bg-copper px-5 py-2.5 text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Browse the marketplace
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/account/orders/${o.id}`}
                className="block rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-copper/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[14.5px] font-semibold">#{o.orderNumber}</span>
                    <span className="text-[13px] text-ink-dim">{o.store.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[12.5px] font-semibold ${STATUS_COLORS[o.status] ?? "text-ink-dim"}`}>
                      {o.status}
                    </span>
                    <span className="text-[14px] font-semibold">{formatMoney(o.totalCents, o.currency)}</span>
                  </div>
                </div>
                <p className="mt-2 truncate text-[13px] text-ink-dim">
                  {o.items.map((i) => `${i.quantity} × ${i.productName}`).join(", ")}
                </p>
                <p className="mt-1 text-[12px] text-ink-faint">
                  Placed {o.createdAt.toLocaleDateString(undefined, { dateStyle: "medium" })}
                  {o.trackingNumber ? ` · Tracking: ${o.trackingNumber}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3 text-[13.5px]">
          {page > 1 ? (
            <Link href={`/account?page=${page - 1}`} className="rounded-lg border border-line px-4 py-2 hover:border-copper">
              ← Previous
            </Link>
          ) : null}
          <span className="text-ink-dim">Page {page} of {pageCount}</span>
          {page < pageCount ? (
            <Link href={`/account?page=${page + 1}`} className="rounded-lg border border-line px-4 py-2 hover:border-copper">
              Next →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
