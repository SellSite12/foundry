import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PageHeader, StatusBadge } from "@/components/seller/ui";
import { ProductEditor, type EditorProduct } from "@/components/seller/ProductEditor";

export const metadata = { title: "Edit product" };

function toLocalDatetime(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ storeId: string; productId: string }>;
}) {
  const { storeId, productId } = await params;
  const access = await getStoreAccess(storeId, "products");
  if (!access) notFound();

  const [product, collections] = await Promise.all([
    db.product.findFirst({
      where: { id: productId, storeId },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: { orderBy: { position: "asc" } },
      },
    }),
    db.collection.findMany({
      where: { storeId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!product) notFound();

  const initial: EditorProduct = {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    type: product.type,
    status: product.status,
    visibility: product.visibility,
    publishAt: toLocalDatetime(product.publishAt),
    price: (product.priceCents / 100).toFixed(2),
    compareAt: product.compareAtCents ? (product.compareAtCents / 100).toFixed(2) : "",
    cost: product.costCents ? (product.costCents / 100).toFixed(2) : "",
    sku: product.sku ?? "",
    barcode: product.barcode ?? "",
    weightGrams: product.weightGrams?.toString() ?? "",
    lengthCm: product.lengthCm?.toString() ?? "",
    widthCm: product.widthCm?.toString() ?? "",
    heightCm: product.heightCm?.toString() ?? "",
    requiresShipping: product.requiresShipping,
    warehouseLocation: product.warehouseLocation ?? "",
    trackInventory: product.trackInventory,
    stock: product.stock.toString(),
    incomingStock: product.incomingStock.toString(),
    lowStockThreshold: product.lowStockThreshold.toString(),
    category: product.category ?? "",
    tags: product.tags ?? "",
    collectionId: product.collectionId ?? "",
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
    images: product.images.map((img) => ({
      url: img.url,
      alt: img.alt ?? "",
      isVideo: img.isVideo,
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      name: v.name,
      options: safeParse(v.options),
      sku: v.sku ?? "",
      barcode: v.barcode ?? "",
      price: v.priceCents !== null ? (v.priceCents / 100).toFixed(2) : "",
      stock: v.stock.toString(),
    })),
  };

  return (
    <div>
      <PageHeader
        title={product.name}
        description={`Last updated ${product.updatedAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`}
        actions={<StatusBadge status={product.status} />}
      />
      <ProductEditor
        storeId={storeId}
        currency={access.store.currency}
        initial={initial}
        collections={collections}
      />
    </div>
  );
}

function safeParse(json: string): Record<string, string> {
  try {
    return JSON.parse(json) as Record<string, string>;
  } catch {
    return {};
  }
}
