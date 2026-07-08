import { notFound } from "next/navigation";
import { Boxes } from "lucide-react";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PageHeader, StatCard, EmptyState, Panel } from "@/components/seller/ui";
import { InventoryTable } from "@/components/seller/InventoryTable";

export const metadata = { title: "Inventory" };

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "inventory");
  if (!access) notFound();

  const [products, history] = await Promise.all([
    db.product.findMany({
      where: { storeId, trackInventory: true, status: { not: "ARCHIVED" } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        reservedStock: true,
        incomingStock: true,
        lowStockThreshold: true,
        warehouseLocation: true,
        variants: {
          orderBy: { position: "asc" },
          select: { id: true, name: true, sku: true, stock: true },
        },
      },
    }),
    db.inventoryAdjustment.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        product: { select: { name: true } },
        variant: { select: { name: true } },
      },
    }),
  ]);

  const totalUnits = products.reduce(
    (s, p) => s + p.stock + p.variants.reduce((x, v) => x + v.stock, 0),
    0
  );
  const lowCount = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const outCount = products.filter((p) => p.stock <= 0 && p.variants.length === 0).length;
  const incoming = products.reduce((s, p) => s + p.incomingStock, 0);

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Live stock levels with full adjustment history."
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Units in stock" value={totalUnits} />
        <StatCard
          label="Low stock"
          value={lowCount}
          sub={lowCount > 0 ? "Needs attention" : "All healthy"}
        />
        <StatCard label="Out of stock" value={outCount} />
        <StatCard label="Incoming" value={incoming} />
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Boxes size={20} />}
          title="Nothing to track yet"
          body="Products with inventory tracking enabled appear here with stock, reservations, and adjustment history."
        />
      ) : (
        <InventoryTable
          storeId={storeId}
          products={products.map((p) => ({
            ...p,
            variants: p.variants,
          }))}
        />
      )}

      <div className="mt-5">
        <Panel title="Recent adjustments">
          {history.length === 0 ? (
            <p className="py-3 text-center text-[13px] text-ink-faint">
              Adjustments and sales-driven stock changes appear here.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {history.map((h) => (
                <div key={h.id} className="flex items-center gap-3 text-[12.5px]">
                  <span
                    className={`fdy-mono w-12 shrink-0 text-right font-semibold ${
                      h.delta > 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {h.delta > 0 ? `+${h.delta}` : h.delta}
                  </span>
                  <span className="truncate text-ink">
                    {h.product.name}
                    {h.variant && <span className="text-ink-faint"> — {h.variant.name}</span>}
                  </span>
                  <span className="rounded-full bg-hover px-2 py-0.5 text-[10px] text-ink-faint">
                    {h.reason}
                  </span>
                  {h.note && <span className="truncate text-ink-faint">{h.note}</span>}
                  <span className="ml-auto shrink-0 text-ink-faint">
                    → {h.stockAfter} ·{" "}
                    {h.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
