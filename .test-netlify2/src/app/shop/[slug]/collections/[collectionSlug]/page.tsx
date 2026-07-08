import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import {
  getLiveStore,
  publicProductWhere,
  PUBLIC_PRODUCT_CARD_SELECT,
  ratingSummary,
  trackVisit,
} from "@/lib/shop/storefront";
import { ProductCard, EmptyNote } from "@/components/storefront/ui";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string; collectionSlug: string }>;
}) {
  const { slug, collectionSlug } = await params;
  const store = await getLiveStore(slug);
  if (!store) notFound();

  const collection = await db.collection.findUnique({
    where: { storeId_slug: { storeId: store.id, slug: collectionSlug } },
  });
  if (!collection) notFound();

  await trackVisit(store.id, `/shop/${slug}/collections/${collectionSlug}`);

  const products = await db.product.findMany({
    where: { ...publicProductWhere(store.id), collectionId: collection.id },
    orderBy: { updatedAt: "desc" },
    select: PUBLIC_PRODUCT_CARD_SELECT,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--sf-text)" }}>
        {collection.name}
      </h1>
      {collection.description ? (
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed" style={{ color: "var(--sf-text-dim)" }}>
          {collection.description}
        </p>
      ) : null}

      <div className="mt-8">
        {products.length === 0 ? (
          <EmptyNote>No products in this collection yet.</EmptyNote>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  name: p.name,
                  slug: p.slug,
                  priceCents: p.priceCents,
                  compareAtCents: p.compareAtCents,
                  currency: p.currency,
                  imageUrl: p.images[0]?.url ?? null,
                  inStock: !p.trackInventory || p.stock > 0,
                  rating: ratingSummary(p.reviews),
                  storeSlug: slug,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
