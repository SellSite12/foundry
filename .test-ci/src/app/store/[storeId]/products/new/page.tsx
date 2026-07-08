import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PageHeader } from "@/components/seller/ui";
import { ProductEditor, type EditorProduct } from "@/components/seller/ProductEditor";

export const metadata = { title: "New product" };

const EMPTY: EditorProduct = {
  name: "",
  description: "",
  type: "PHYSICAL",
  status: "DRAFT",
  visibility: "VISIBLE",
  publishAt: "",
  price: "",
  compareAt: "",
  cost: "",
  sku: "",
  barcode: "",
  weightGrams: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  requiresShipping: true,
  warehouseLocation: "",
  trackInventory: true,
  stock: "0",
  incomingStock: "0",
  lowStockThreshold: "5",
  category: "",
  tags: "",
  collectionId: "",
  seoTitle: "",
  seoDescription: "",
  images: [],
  variants: [],
};

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const access = await getStoreAccess(storeId, "products");
  if (!access) notFound();

  const collections = await db.collection.findMany({
    where: { storeId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader title="New product" description="Drafts are private until you publish them." />
      <ProductEditor
        storeId={storeId}
        currency={access.store.currency}
        initial={EMPTY}
        collections={collections}
      />
    </div>
  );
}
