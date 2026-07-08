"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Download, Upload, Plus } from "lucide-react";

import { api } from "@/lib/client/api";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Table, Th, Td, Pagination, Modal } from "@/components/seller/ui";

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  tags: string | null;
  orderCount: number;
  lifetimeValueCents: number;
  createdAt: string;
};

export function CustomersTable({
  storeId,
  currency,
  customers,
  page,
  pageCount,
  q,
  toolbarOnly = false,
}: {
  storeId: string;
  currency: string;
  customers: Row[];
  page: number;
  pageCount: number;
  q: string;
  toolbarOnly?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState(q);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", tags: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<string | null>(null);

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams({ q: search, ...params });
    for (const [k, v] of [...sp.entries()]) if (!v) sp.delete(k);
    router.push(`${pathname}?${sp.toString()}`);
  }

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    const res = await api(`/api/store/${storeId}/customers`, {
      method: "POST",
      body: {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        tags: form.tags || null,
      },
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.fieldErrors ? null : res.error);
      setFieldErrors(res.fieldErrors ?? {});
      return;
    }
    setAddOpen(false);
    setForm({ name: "", email: "", phone: "", tags: "" });
    router.refresh();
  }

  async function importCsv(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = await api<{ created: number; updated: number; skipped: number }>(
      `/api/store/${storeId}/customers/import`,
      { method: "POST", body: { csv: text } }
    );
    if (fileRef.current) fileRef.current.value = "";
    if (res.ok) {
      setImportResult(
        `Imported: ${res.data.created} created, ${res.data.updated} updated, ${res.data.skipped} skipped.`
      );
      router.refresh();
      setTimeout(() => setImportResult(null), 4000);
    } else {
      setImportResult(res.error);
    }
  }

  const toolbar = (
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
          placeholder="Search name, email, tag…"
          className="w-full rounded-full border border-line bg-surface py-2 pl-9 pr-4 text-[13px] text-ink outline-none focus:border-line-strong sm:w-72"
        />
      </form>
      <div className="flex items-center gap-2">
        <a
          href={`/api/store/${storeId}/customers/export`}
          className="flex items-center gap-1.5 rounded-full border border-line-strong px-3.5 py-2 text-[12.5px] text-ink-dim hover:text-ink"
        >
          <Download size={13} /> Export CSV
        </a>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 rounded-full border border-line-strong px-3.5 py-2 text-[12.5px] text-ink-dim hover:text-ink"
        >
          <Upload size={13} /> Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => importCsv(e.target.files)}
        />
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={14} /> Add customer
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      {toolbar}
      {importResult && (
        <div className="mb-3 rounded-xl bg-success-soft px-4 py-2 text-[12.5px] text-success">
          {importResult}
        </div>
      )}

      {!toolbarOnly && (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Phone</Th>
                <Th>Tags</Th>
                <Th>Orders</Th>
                <Th>Lifetime value</Th>
                <Th>Since</Th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-faint">
                    No customers match this search.
                  </td>
                </tr>
              )}
              {customers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/store/${storeId}/customers/${c.id}`)}
                  className="cursor-pointer hover:bg-hover"
                >
                  <Td>
                    <Link
                      href={`/store/${storeId}/customers/${c.id}`}
                      className="font-medium text-ink"
                    >
                      {c.name}
                    </Link>
                    <div className="text-[11.5px] text-ink-faint">{c.email}</div>
                  </Td>
                  <Td>{c.phone ?? "—"}</Td>
                  <Td>
                    {c.tags ? (
                      <div className="flex flex-wrap gap-1">
                        {c.tags.split(",").slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-copper-soft px-2 py-0.5 text-[10.5px] text-copper"
                          >
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td className="fdy-mono">{c.orderCount}</Td>
                  <Td className="fdy-mono text-ink">
                    {formatMoney(c.lifetimeValueCents, currency)}
                  </Td>
                  <Td>
                    {new Date(c.createdAt).toLocaleDateString("en-US", {
                      month: "short",
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
              const sp = new URLSearchParams({ q: search, page: String(p) });
              for (const [k, v] of [...sp.entries()]) if (!v) sp.delete(k);
              return `${pathname}?${sp.toString()}`;
            }}
          />
        </>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add customer">
        <form onSubmit={addCustomer} className="flex flex-col gap-4" noValidate>
          {error && <Alert kind="error">{error}</Alert>}
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={fieldErrors.name}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={fieldErrors.email}
            required
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Input
            label="Tags (comma-separated)"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="vip, wholesale"
          />
          <Button type="submit" loading={saving} full>
            Add customer
          </Button>
        </form>
      </Modal>
    </div>
  );
}
