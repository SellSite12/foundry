"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Copy, Archive, Check } from "lucide-react";

import { api } from "@/lib/client/api";
import { toCents } from "@/lib/money";
import { PRODUCT_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Panel } from "@/components/seller/ui";
import { MediaPicker } from "@/components/seller/MediaPicker";

export type EditorVariant = {
  id?: string;
  name: string;
  options: Record<string, string>;
  sku: string;
  barcode: string;
  price: string; // dollars, empty = inherit
  stock: string;
};

export type EditorProduct = {
  id?: string;
  name: string;
  description: string;
  type: string;
  status: string;
  visibility: string;
  publishAt: string; // datetime-local value
  price: string;
  compareAt: string;
  cost: string;
  sku: string;
  barcode: string;
  weightGrams: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  requiresShipping: boolean;
  warehouseLocation: string;
  trackInventory: boolean;
  stock: string;
  incomingStock: string;
  lowStockThreshold: string;
  category: string;
  tags: string;
  collectionId: string;
  seoTitle: string;
  seoDescription: string;
  images: { url: string; alt: string; isVideo: boolean }[];
  variants: EditorVariant[];
};

const selectClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-line-strong";
const labelClass = "text-[12.5px] font-medium text-ink-dim";

export function ProductEditor({
  storeId,
  currency,
  initial,
  collections,
}: {
  storeId: string;
  currency: string;
  initial: EditorProduct;
  collections: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isNew = !initial.id;

  const set = <K extends keyof EditorProduct>(k: K, v: EditorProduct[K]) =>
    setP((prev) => ({ ...prev, [k]: v }));

  function buildPayload() {
    return {
      name: p.name,
      description: p.description || null,
      type: p.type,
      status: p.status,
      visibility: p.visibility,
      publishAt: p.publishAt ? new Date(p.publishAt).toISOString() : null,
      priceCents: toCents(p.price),
      compareAtCents: p.compareAt ? toCents(p.compareAt) : null,
      costCents: p.cost ? toCents(p.cost) : null,
      sku: p.sku || null,
      barcode: p.barcode || null,
      weightGrams: p.weightGrams ? parseInt(p.weightGrams, 10) : null,
      lengthCm: p.lengthCm ? parseFloat(p.lengthCm) : null,
      widthCm: p.widthCm ? parseFloat(p.widthCm) : null,
      heightCm: p.heightCm ? parseFloat(p.heightCm) : null,
      requiresShipping: p.requiresShipping,
      warehouseLocation: p.warehouseLocation || null,
      trackInventory: p.trackInventory,
      stock: parseInt(p.stock, 10) || 0,
      incomingStock: parseInt(p.incomingStock, 10) || 0,
      lowStockThreshold: parseInt(p.lowStockThreshold, 10) || 0,
      category: p.category || null,
      tags: p.tags || null,
      collectionId: p.collectionId || null,
      seoTitle: p.seoTitle || null,
      seoDescription: p.seoDescription || null,
      images: p.images.map((img, i) => ({
        url: img.url,
        alt: img.alt || null,
        isVideo: img.isVideo,
        position: i,
      })),
      variants: p.variants.map((v, i) => ({
        ...(v.id && { id: v.id }),
        name: v.name,
        options: v.options,
        sku: v.sku || null,
        barcode: v.barcode || null,
        priceCents: v.price ? toCents(v.price) : null,
        stock: parseInt(v.stock, 10) || 0,
        position: i,
      })),
    };
  }

  async function save() {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    const res = isNew
      ? await api<{ product: { id: string } }>(`/api/store/${storeId}/products`, {
          method: "POST",
          body: buildPayload(),
        })
      : await api<{ product: { id: string } }>(
          `/api/store/${storeId}/products/${initial.id}`,
          { method: "PATCH", body: buildPayload() }
        );
    setSaving(false);

    if (!res.ok) {
      setError(res.error);
      setFieldErrors(res.fieldErrors ?? {});
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (isNew) {
      router.replace(`/store/${storeId}/products/${res.data.product.id}`);
    }
    router.refresh();
  }

  async function duplicate() {
    if (!initial.id) return;
    const res = await api<{ product: { id: string } }>(
      `/api/store/${storeId}/products/${initial.id}/duplicate`,
      { method: "POST" }
    );
    if (res.ok) router.push(`/store/${storeId}/products/${res.data.product.id}`);
  }

  async function remove() {
    if (!initial.id) return;
    if (!confirm("Delete this product? Products with order history are archived instead.")) return;
    const res = await api(`/api/store/${storeId}/products/${initial.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push(`/store/${storeId}/products`);
      router.refresh();
    }
  }

  function addVariant() {
    set("variants", [
      ...p.variants,
      { name: "", options: {}, sku: "", barcode: "", price: "", stock: "0" },
    ]);
  }

  function setVariant(i: number, patch: Partial<EditorVariant>) {
    set(
      "variants",
      p.variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v))
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="flex flex-col gap-5 lg:col-span-2">
        {error && <Alert kind="error">{error}</Alert>}
        {saved && (
          <div className="fdy-pop flex items-center gap-2 rounded-xl bg-success-soft px-4 py-2.5 text-[13px] text-success">
            <Check size={14} /> Saved
          </div>
        )}

        <Panel title="Details">
          <div className="flex flex-col gap-4">
            <Input
              label="Product name"
              value={p.name}
              onChange={(e) => set("name", e.target.value)}
              error={fieldErrors.name}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Description</label>
              <textarea
                value={p.description}
                onChange={(e) => set("description", e.target.value)}
                rows={5}
                className={selectClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Type</label>
                <select
                  value={p.type}
                  onChange={(e) => set("type", e.target.value)}
                  className={selectClass}
                >
                  {PRODUCT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t[0] + t.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Category"
                value={p.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="e.g. Apparel"
              />
            </div>
            <Input
              label="Tags (comma-separated)"
              value={p.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="summer, limited, bestseller"
            />
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Collection</label>
              <select
                value={p.collectionId}
                onChange={(e) => set("collectionId", e.target.value)}
                className={selectClass}
              >
                <option value="">No collection</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Panel>

        <Panel title="Media" description="Images and videos from your media library or by URL.">
          <MediaPicker
            storeId={storeId}
            images={p.images}
            onChange={(images) => set("images", images)}
          />
        </Panel>

        <Panel title="Pricing">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label={`Price (${currency})`}
              type="number"
              min="0"
              step="0.01"
              value={p.price}
              onChange={(e) => set("price", e.target.value)}
              error={fieldErrors.priceCents}
            />
            <Input
              label="Compare-at price"
              type="number"
              min="0"
              step="0.01"
              value={p.compareAt}
              onChange={(e) => set("compareAt", e.target.value)}
              hint="Shown struck through"
            />
            <Input
              label="Cost per item"
              type="number"
              min="0"
              step="0.01"
              value={p.cost}
              onChange={(e) => set("cost", e.target.value)}
              hint="Used for margin reports"
            />
          </div>
        </Panel>

        <Panel title="Inventory">
          <div className="flex flex-col gap-4">
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-dim">
              <input
                type="checkbox"
                checked={p.trackInventory}
                onChange={(e) => set("trackInventory", e.target.checked)}
                className="h-4 w-4 accent-[#E8A33D]"
              />
              Track inventory for this product
            </label>
            {p.trackInventory && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Input
                  label="In stock"
                  type="number"
                  min="0"
                  value={p.stock}
                  onChange={(e) => set("stock", e.target.value)}
                />
                <Input
                  label="Incoming"
                  type="number"
                  min="0"
                  value={p.incomingStock}
                  onChange={(e) => set("incomingStock", e.target.value)}
                />
                <Input
                  label="Low-stock alert at"
                  type="number"
                  min="0"
                  value={p.lowStockThreshold}
                  onChange={(e) => set("lowStockThreshold", e.target.value)}
                />
                <Input
                  label="Warehouse location"
                  value={p.warehouseLocation}
                  onChange={(e) => set("warehouseLocation", e.target.value)}
                  placeholder="Aisle 3, Bin 12"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="SKU"
                value={p.sku}
                onChange={(e) => set("sku", e.target.value)}
              />
              <Input
                label="Barcode (ISBN, UPC…)"
                value={p.barcode}
                onChange={(e) => set("barcode", e.target.value)}
              />
            </div>
          </div>
        </Panel>

        <Panel
          title="Variants"
          description="Sizes, colors, and other options with their own SKU, price, and stock."
          actions={
            <Button variant="ghost" onClick={addVariant}>
              <Plus size={13} /> Add variant
            </Button>
          }
        >
          {p.variants.length === 0 ? (
            <p className="text-[13px] text-ink-faint">
              This product has no variants — it sells as a single item.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {p.variants.map((v, i) => (
                <div key={v.id ?? `new-${i}`} className="rounded-xl border border-line bg-base2 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-ink-dim">
                      Variant {i + 1}
                    </span>
                    <button
                      onClick={() =>
                        set("variants", p.variants.filter((_, idx) => idx !== i))
                      }
                      className="text-ink-faint hover:text-danger"
                      aria-label="Remove variant"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Input
                      label="Name (e.g. M / Red)"
                      value={v.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        // Derive options from "Size / Color" style names.
                        const parts = name.split("/").map((s) => s.trim()).filter(Boolean);
                        const options: Record<string, string> = {};
                        parts.forEach((part, idx) => {
                          options[idx === 0 ? "Option 1" : `Option ${idx + 1}`] = part;
                        });
                        setVariant(i, { name, options });
                      }}
                    />
                    <Input
                      label="SKU"
                      value={v.sku}
                      onChange={(e) => setVariant(i, { sku: e.target.value })}
                    />
                    <Input
                      label="Barcode"
                      value={v.barcode}
                      onChange={(e) => setVariant(i, { barcode: e.target.value })}
                    />
                    <Input
                      label={`Price (${currency})`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={v.price}
                      onChange={(e) => setVariant(i, { price: e.target.value })}
                      hint="Empty = product price"
                    />
                    <Input
                      label="Stock"
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => setVariant(i, { stock: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Shipping">
          <div className="flex flex-col gap-4">
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-dim">
              <input
                type="checkbox"
                checked={p.requiresShipping}
                onChange={(e) => set("requiresShipping", e.target.checked)}
                className="h-4 w-4 accent-[#E8A33D]"
              />
              This is a physical product that requires shipping
            </label>
            {p.requiresShipping && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Input
                  label="Weight (g)"
                  type="number"
                  min="0"
                  value={p.weightGrams}
                  onChange={(e) => set("weightGrams", e.target.value)}
                />
                <Input
                  label="Length (cm)"
                  type="number"
                  min="0"
                  step="0.1"
                  value={p.lengthCm}
                  onChange={(e) => set("lengthCm", e.target.value)}
                />
                <Input
                  label="Width (cm)"
                  type="number"
                  min="0"
                  step="0.1"
                  value={p.widthCm}
                  onChange={(e) => set("widthCm", e.target.value)}
                />
                <Input
                  label="Height (cm)"
                  type="number"
                  min="0"
                  step="0.1"
                  value={p.heightCm}
                  onChange={(e) => set("heightCm", e.target.value)}
                />
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Search engine listing">
          <div className="flex flex-col gap-4">
            <Input
              label="SEO title"
              value={p.seoTitle}
              onChange={(e) => set("seoTitle", e.target.value)}
              hint={`${p.seoTitle.length}/70 recommended`}
            />
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>SEO description</label>
              <textarea
                value={p.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
                rows={3}
                maxLength={320}
                className={selectClass}
              />
              <span className="text-[11px] text-ink-faint">
                {p.seoDescription.length}/160 recommended
              </span>
            </div>
          </div>
        </Panel>
      </div>

      {/* sidebar column */}
      <div className="flex flex-col gap-5">
        <Panel title="Status">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Product status</label>
              <select
                value={p.status}
                onChange={(e) => set("status", e.target.value)}
                className={selectClass}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Visibility</label>
              <select
                value={p.visibility}
                onChange={(e) => set("visibility", e.target.value)}
                className={selectClass}
              >
                <option value="VISIBLE">Visible</option>
                <option value="HIDDEN">Hidden</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Schedule publishing</label>
              <input
                type="datetime-local"
                value={p.publishAt}
                onChange={(e) => set("publishAt", e.target.value)}
                className={selectClass}
              />
              <span className="text-[11px] text-ink-faint">
                Optional — the product goes live at this time.
              </span>
            </div>
          </div>
        </Panel>

        <div className="flex flex-col gap-2.5">
          <Button onClick={save} loading={saving} full>
            <Save size={14} /> {isNew ? "Create product" : "Save changes"}
          </Button>
          {!isNew && (
            <>
              <Button variant="secondary" onClick={duplicate} full>
                <Copy size={14} /> Duplicate
              </Button>
              <Button variant="ghost" onClick={remove} full>
                <span className="flex items-center gap-2 text-danger">
                  {p.status === "ARCHIVED" ? <Trash2 size={14} /> : <Archive size={14} />}
                  Delete product
                </span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
