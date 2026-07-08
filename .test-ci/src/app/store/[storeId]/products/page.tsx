import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Package } from "lucide-react";

import { db } from "@/lib/db";
import { getStoreAccess } from "@/lib/seller/access";
import { PAGE_SIZE } from "@/lib/seller/pagination";
import { PageHeader, EmptyState } from "@/components/seller/ui";
import { ProductsTable } from "@/components/seller/ProductsTable";
import { Button } from "@/components/ui/Button";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Products" };

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { storeId } = await params;
  const sp = await searchParams;
  const access = await getStoreAccess(storeId, "products");
  if (!access) notFound();
  const { store } = access;

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const q = sp.q?.trim();
  const status = sp.status;

  const where: Prisma.ProductWhereInput = {
    storeId,
    ...(status ? { status } : {}),
    ...(q && {
      OR: [
        { name: { contains: q } },
        { sku: { contains: q } },
        { tags: { contains: q } },
        { category: { contains: q } },
      ],
    }),
  };

  const [total, products, anyProduct] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        _count: { select: { variants: true } },
      },
    }),
    db.product.findFirst({ where: { storeId }, select: { id: true } }),
  ]);

  const base = `/store/${storeId}`;

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${total} product${total === 1 ? "" : "s"}${status ? ` · ${status.toLowerCase()}` : ""}`}
        actions={
          <Link href={`${base}/products/new`}>
            <Button>
              <Plus size={14} /> Add product
            </Button>
          </Link>
        }
      />

      {!anyProduct ? (
        <EmptyState
          icon={<Package size={20} />}
          title="No products yet"
          body="Products you create appear here — with variants, inventory, SEO, and scheduling. Everything is stored in your database."
          action={
            <Link href={`${base}/products/new`}>
              <Button>
                <Plus size={14} /> Add your first product
              </Button>
            </Link>
          }
        />
      ) : (
        <ProductsTable
          storeId={storeId}
          currency={store.currency}
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            priceCents: p.priceCents,
            stock: p.stock,
            trackInventory: p.trackInventory,
            sku: p.sku,
            category: p.category,
            imageUrl: p.images[0]?.url ?? null,
            variantCount: p._count.variants,
          }))}
          page={page}
          pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
          q={q ?? ""}
          status={status ?? ""}
        />
      )}
    </div>
  );
}
