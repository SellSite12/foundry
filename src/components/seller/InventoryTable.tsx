"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { api } from "@/lib/client/api";
import { INVENTORY_REASONS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Table, Th, Td, Modal } from "@/components/seller/ui";

type VariantRow = { id: string; name: string; sku: string | null; stock: number };
type Row = {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  reservedStock: number;
  incomingStock: number;
  lowStockThreshold: number;
  warehouseLocation: string | null;
  variants: VariantRow[];
};

export function InventoryTable({ storeId, products }: { storeId: string; products: Row[] }) {
  const router = useRouter();
  const [target, setTarget] = useState<{
    productId: string;
    variantId: string | null;
    label: string;
    current: number;
  } | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState<string>("RESTOCK");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function adjust(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    setSaving(true);
    setError(null);
    const res = await api(`/api/store/${storeId}/inventory`, {
      method: "POST",
      body: {
        productId: target.productId,
        variantId: target.variantId,
        delta: parseInt(delta, 10) || 0,
        reason,
        note: note || null,
      },
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setTarget(null);
    setDelta("");
    setNote("");
    router.refresh();
  }

  function stockClass(stock: number, threshold: number) {
    if (stock <= 0) return "text-danger font-semibold";
    if (stock <= threshold) return "text-copper font-semibold";
    return "text-ink";
  }

  return (
    <>
      <Table>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>SKU</Th>
            <Th>In stock</Th>
            <Th>Reserved</Th>
            <Th>Incoming</Th>
            <Th>Location</Th>
            <Th className="w-24"></Th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <Fragment key={p.id}>
              <tr className="hover:bg-hover">
                <Td className="font-medium text-ink">{p.name}</Td>
                <Td>{p.sku ?? "—"}</Td>
                <Td>
                  <span className={stockClass(p.stock, p.lowStockThreshold)}>{p.stock}</span>
                  {p.stock <= 0 && (
                    <span className="ml-2 rounded-full bg-danger-soft px-2 py-0.5 text-[10px] text-danger">
                      OUT
                    </span>
                  )}
                  {p.stock > 0 && p.stock <= p.lowStockThreshold && (
                    <span className="ml-2 rounded-full bg-copper-soft px-2 py-0.5 text-[10px] text-copper">
                      LOW
                    </span>
                  )}
                </Td>
                <Td>{p.reservedStock}</Td>
                <Td>{p.incomingStock}</Td>
                <Td>{p.warehouseLocation ?? "—"}</Td>
                <Td>
                  <button
                    onClick={() =>
                      setTarget({
                        productId: p.id,
                        variantId: null,
                        label: p.name,
                        current: p.stock,
                      })
                    }
                    className="flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-[11.5px] text-ink-dim hover:text-ink"
                  >
                    <SlidersHorizontal size={12} /> Adjust
                  </button>
                </Td>
              </tr>
              {p.variants.map((v) => (
                <tr key={v.id} className="bg-base2/50 hover:bg-hover">
                  <Td className="pl-9 text-[12.5px]">↳ {v.name}</Td>
                  <Td>{v.sku ?? "—"}</Td>
                  <Td>
                    <span className={stockClass(v.stock, p.lowStockThreshold)}>{v.stock}</span>
                  </Td>
                  <Td>—</Td>
                  <Td>—</Td>
                  <Td>—</Td>
                  <Td>
                    <button
                      onClick={() =>
                        setTarget({
                          productId: p.id,
                          variantId: v.id,
                          label: `${p.name} — ${v.name}`,
                          current: v.stock,
                        })
                      }
                      className="flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-1.5 text-[11.5px] text-ink-dim hover:text-ink"
                    >
                      <SlidersHorizontal size={12} /> Adjust
                    </button>
                  </Td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </Table>

      <Modal open={Boolean(target)} onClose={() => setTarget(null)} title="Adjust stock">
        {target && (
          <form onSubmit={adjust} className="flex flex-col gap-4" noValidate>
            {error && <Alert kind="error">{error}</Alert>}
            <p className="text-[13px] text-ink-dim">
              <span className="font-medium text-ink">{target.label}</span> — currently{" "}
              <span className="fdy-mono">{target.current}</span> in stock.
            </p>
            <Input
              label="Adjustment (use negative to remove)"
              type="number"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="+10 or -3"
              required
              autoFocus
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-ink-dim">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none"
              >
                {INVENTORY_REASONS.filter((r) => r !== "SALE").map((r) => (
                  <option key={r} value={r}>
                    {r[0] + r.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="PO #1234 received"
            />
            <Button type="submit" loading={saving} full>
              Apply adjustment
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
