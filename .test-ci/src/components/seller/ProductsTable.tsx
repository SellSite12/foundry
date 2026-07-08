"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Search, Copy, Archive, Trash2, CheckCircle2, FileEdit } from "lucide-react";

import { api } from "@/lib/client/api";
import { formatMoney } from "@/lib/money";
import { StatusBadge, Table, Th, Td, Pagination } from "@/components/seller/ui";

type Row = {
  id: string;
  name: string;
  status: string;
  priceCents: number;
  stock: number;
  trackInventory: boolean;
  sku: string | null;
  category: string | null;
  imageUrl: string | null;
  variantCount: number;
};

const FILTERS = [
  { value: "", label: "All" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
  { value: "ARCHIVED", label: "Archived" },
];

export function ProductsTable({
  storeId,
  currency,
  products,
  page,
  pageCount,
  q,
  status,
}: {
  storeId: string;
  currency: string;
  products: Row[];
  page: number;
  pageCount: number;
  q: string;
  status: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState(q);
  const [message, setMessage] = useState<string | null>(null);

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams({ q: search, status, ...params });
    for (const [k, v] of [...sp.entries()]) if (!v) sp.delete(k);
    router.push(`${pathname}?${sp.toString()}`);
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulk(action: string) {
    if (selected.size === 0) return;
    if (action === "DELETE" && !confirm(`Delete ${selected.size} product(s)? Products with orders will be archived instead.`)) {
      return;
    }
    setBusy(true);
    const res = await api<{ affected: number }>(`/api/store/${storeId}/products/bulk`, {
      method: "POST",
      body: { ids: [...selected], action },
    });
    setBusy(false);
    if (res.ok) {
      setMessage(`${res.data.affected} product(s) updated`);
      setSelected(new Set());
      router.refresh();
      setTimeout(() => setMessage(null), 2500);
    }
  }

  async function duplicate(id: string) {
    setBusy(true);
    const res = await api<{ product: { id: string } }>(
      `/api/store/${storeId}/products/${id}/duplicate`,
      { method: "POST" }
    );
    setBusy(false);
    if (res.ok) router.push(`/store/${storeId}/products/${res.data.product.id}`);
  }

  const allSelected = products.length > 0 && products.every((p) => selected.has(p.id));

  return (
    <div>
      {/* toolbar */}
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
            placeholder="Search name, SKU, tag…"
            className="w-full rounded-full border border-line bg-surface py-2 pl-9 pr-4 text-[13px] text-ink outline-none focus:border-line-strong sm:w-72"
          />
        </form>
        <div className="flex items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => navigate({ status: f.value, page: "1" })}
              className={`rounded-full px-3.5 py-1.5 text-[12px] transition-colors ${
                status === f.value
                  ? "bg-copper-soft font-medium text-copper"
                  : "text-ink-faint hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* bulk bar */}
      {selected.size > 0 && (
        <div className="fdy-pop mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-line-strong bg-surface2 px-4 py-2.5">
          <span className="text-[12.5px] font-medium text-ink">
            {selected.size} selected
          </span>
          <div className="ml-auto flex flex-wrap gap-1.5">
            <BulkBtn onClick={() => bulk("PUBLISH")} disabled={busy} icon={<CheckCircle2 size={13} />}>
              Publish
            </BulkBtn>
            <BulkBtn onClick={() => bulk("DRAFT")} disabled={busy} icon={<FileEdit size={13} />}>
              Set draft
            </BulkBtn>
            <BulkBtn onClick={() => bulk("ARCHIVE")} disabled={busy} icon={<Archive size={13} />}>
              Archive
            </BulkBtn>
            <BulkBtn onClick={() => bulk("DELETE")} disabled={busy} danger icon={<Trash2 size={13} />}>
              Delete
            </BulkBtn>
          </div>
        </div>
      )}

      {message && (
        <div className="mb-3 rounded-xl bg-success-soft px-4 py-2 text-[12.5px] text-success">
          {message}
        </div>
      )}

      <Table>
        <thead>
          <tr>
            <Th className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() =>
                  setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)))
                }
                className="h-3.5 w-3.5 accent-[#E8A33D]"
              />
            </Th>
            <Th>Product</Th>
            <Th>Status</Th>
            <Th>Price</Th>
            <Th>Inventory</Th>
            <Th>Category</Th>
            <Th className="w-20"></Th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-ink-faint">
                No products match this filter.
              </td>
            </tr>
          )}
          {products.map((p) => (
            <tr key={p.id} className="group hover:bg-hover">
              <Td>
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                  className="h-3.5 w-3.5 accent-[#E8A33D]"
                />
              </Td>
              <Td>
                <Link
                  href={`/store/${storeId}/products/${p.id}`}
                  className="flex items-center gap-3"
                >
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-lg border border-line object-cover"
                      unoptimized={!p.imageUrl.startsWith("/")}
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-base2 text-[10px] text-ink-faint">
                      —
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-ink">{p.name}</div>
                    <div className="text-[11px] text-ink-faint">
                      {p.sku ?? "No SKU"}
                      {p.variantCount > 0 && ` · ${p.variantCount} variants`}
                    </div>
                  </div>
                </Link>
              </Td>
              <Td>
                <StatusBadge status={p.status} />
              </Td>
              <Td className="fdy-mono">{formatMoney(p.priceCents, currency)}</Td>
              <Td>
                {p.trackInventory ? (
                  <span className={p.stock <= 0 ? "text-danger" : ""}>{p.stock} in stock</span>
                ) : (
                  <span className="text-ink-faint">Not tracked</span>
                )}
              </Td>
              <Td>{p.category ?? "—"}</Td>
              <Td>
                <button
                  onClick={() => duplicate(p.id)}
                  disabled={busy}
                  title="Duplicate"
                  className="rounded-lg p-1.5 text-ink-faint opacity-0 transition-opacity hover:bg-hover hover:text-ink group-hover:opacity-100"
                >
                  <Copy size={14} />
                </button>
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

function BulkBtn({
  children,
  onClick,
  disabled,
  danger = false,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors disabled:opacity-50 ${
        danger
          ? "border-danger/30 text-danger hover:bg-danger-soft"
          : "border-line-strong text-ink-dim hover:text-ink"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
