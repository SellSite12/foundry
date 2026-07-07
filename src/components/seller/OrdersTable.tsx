"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";

import { formatMoney } from "@/lib/money";
import { ORDER_STATUSES } from "@/lib/constants";
import { StatusBadge, Table, Th, Td, Pagination } from "@/components/seller/ui";

type Row = {
  id: string;
  orderNumber: number;
  customerEmail: string;
  customerName: string | null;
  status: string;
  totalCents: number;
  currency: string;
  itemCount: number;
  createdAt: string;
};

export function OrdersTable({
  storeId,
  orders,
  page,
  pageCount,
  q,
  status,
}: {
  storeId: string;
  orders: Row[];
  page: number;
  pageCount: number;
  q: string;
  status: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(q);

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams({ q: search, status, ...params });
    for (const [k, v] of [...sp.entries()]) if (!v) sp.delete(k);
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ page: "1" });
          }}
          className="relative"
        >
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search #, email, tracking…"
            className="w-full rounded-full border border-line bg-surface py-2 pl-9 pr-4 text-[13px] text-ink outline-none focus:border-line-strong sm:w-72"
          />
        </form>
        <select
          value={status}
          onChange={(e) => navigate({ status: e.target.value, page: "1" })}
          className="rounded-full border border-line bg-surface px-3.5 py-2 text-[12.5px] text-ink-dim outline-none"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0] + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th>Status</Th>
            <Th>Items</Th>
            <Th>Total</Th>
            <Th>Date</Th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-ink-faint">
                No orders match this filter.
              </td>
            </tr>
          )}
          {orders.map((o) => (
            <tr
              key={o.id}
              onClick={() => router.push(`/store/${storeId}/orders/${o.id}`)}
              className="cursor-pointer hover:bg-hover"
            >
              <Td>
                <Link
                  href={`/store/${storeId}/orders/${o.id}`}
                  className="fdy-mono font-semibold text-ink"
                >
                  #{o.orderNumber}
                </Link>
              </Td>
              <Td>
                <div className="text-ink">{o.customerName ?? "—"}</div>
                <div className="text-[11.5px] text-ink-faint">{o.customerEmail}</div>
              </Td>
              <Td>
                <StatusBadge status={o.status} />
              </Td>
              <Td>{o.itemCount}</Td>
              <Td className="fdy-mono text-ink">{formatMoney(o.totalCents, o.currency)}</Td>
              <Td>
                {new Date(o.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination
        page={page}
        pageCount={pageCount}
        makeHref={(p) => {
          const sp = new URLSearchParams({ q: search, status, page: String(p) });
          for (const [k, v] of [...sp.entries()]) if (!v) sp.delete(k);
          return `${pathname}?${sp.toString()}`;
        }}
      />
    </div>
  );
}
