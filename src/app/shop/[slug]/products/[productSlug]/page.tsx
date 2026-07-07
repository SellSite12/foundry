import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import {
  getLiveStore,
  publicProductWhere,
  PUBLIC_PRODUCT_CARD_SELECT,
  ratingSummary,
  trackVisit,
} from "@/lib/shop/storefront";
import { getCurrentUser } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { ProductPurchase } from "@/components/storefront/ProductPurchase";
import { WishlistButton, ShareButtons } from "@/components/storefront/WishlistShare";
import { ReviewsSection } from "@/components/storefront/ReviewsSection";
import { QuestionsSection } from "@/components/storefront/QuestionsSection";
import { RecentlyViewed } from "@/components/storefront/RecentlyViewed";
import { ProductCard, SectionHeading } from "@/components/storefront/ui";

type Params = Promise<{ slug: string; productSlug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const store = await getLiveStore(slug);
  if (!store) return {};
  const product = await db.product.findFirst({
    where: { ...publicProductWhere(store.id), slug: productSlug },
    select: { name: true, seoTitle: true, seoDescription: true, description: true },
  });
  if (!product) return {};
  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.description?.slice(0, 160),
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug, productSlug } = await params;
  const store = await getLiveStore(slug);
  if (!store) notFound();

  const product = await db.product.findFirst({
    where: { ...publicProductWhere(store.id), slug: productSlug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { position: "asc" } },
      reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
      collection: { select: { name: true, slug: true } },
    },
  });
  if (!product) notFound();

  await trackVisit(store.id, `/shop/${slug}/products/${productSlug}`);

  const user = await getCurrentUser();
  const wishlisted = user
    ? Boolean(
        await db.wishlistItem.findUnique({
          where: { userId_productId: { userId: user.id, productId: product.id } },
          select: { id: true },
        })
      )
    : false;

  // Cheapest active delivery rate provides the shipping estimate.
  const estimateRate = product.requiresShipping
    ? await db.shippingRate.findFirst({
        where: { storeId: store.id, active: true, kind: "DELIVERY", minDays: { not: null } },
        orderBy: { priceCents: "asc" },
        select: { minDays: true, maxDays: true },
      })
    : null;

  const related = await db.product.findMany({
    where: {
      ...publicProductWhere(store.id),
      id: { not: product.id },
      ...(product.category ? { category: product.category } : {}),
    },
    take: 4,
    orderBy: { updatedAt: "desc" },
    select: PUBLIC_PRODUCT_CARD_SELECT,
  });

  const rating = ratingSummary(product.reviews);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6 text-[12.5px]" style={{ color: "var(--sf-text-dim)" }}>
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href={`/shop/${slug}`} className="hover:opacity-75">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={`/shop/${slug}/products`} className="hover:opacity-75">Products</Link></li>
          {product.category ? (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link href={`/shop/${slug}/products?category=${encodeURIComponent(product.category)}`} className="hover:opacity-75">
                  {product.category}
                </Link>
              </li>
            </>
          ) : null}
          <li aria-hidden>/</li>
          <li aria-current="page" style={{ color: "var(--sf-text)" }}>{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery
          media={product.images.map((i) => ({ url: i.url, alt: i.alt, isVideo: i.isVideo }))}
          productName={product.name}
        />

        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--sf-text)" }}>
            {product.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {rating.count > 0 ? (
              <a href="#reviews" className="hover:opacity-75">
                <span className="text-[13px]" style={{ color: "var(--sf-primary)" }}>
                  ★ {rating.average} ({rating.count} review{rating.count === 1 ? "" : "s"})
                </span>
              </a>
            ) : null}
            {product.sku ? (
              <span className="text-[12px]" style={{ color: "var(--sf-text-dim)" }}>SKU: {product.sku}</span>
            ) : null}
          </div>

          <div className="mt-6">
            <ProductPurchase
              slug={slug}
              productId={product.id}
              priceCents={product.priceCents}
              compareAtCents={product.compareAtCents}
              currency={product.currency}
              trackInventory={product.trackInventory}
              stock={product.stock}
              variants={product.variants.map((v) => ({
                id: v.id,
                name: v.name,
                options: JSON.parse(v.options) as Record<string, string>,
                priceCents: v.priceCents,
                stock: v.stock,
              }))}
              requiresShipping={product.requiresShipping}
              shippingEstimate={estimateRate}
            />
          </div>

          <div className="mt-5 flex gap-2">
            <WishlistButton productId={product.id} initialWishlisted={wishlisted} loggedIn={Boolean(user)} />
            <ShareButtons title={product.name} />
          </div>

          {product.description ? (
            <div className="mt-8 border-t pt-6" style={{ borderColor: "var(--sf-line)" }}>
              <h2 className="mb-2 text-[15px] font-semibold" style={{ color: "var(--sf-text)" }}>About this product</h2>
              <p className="whitespace-pre-line text-[14px] leading-relaxed" style={{ color: "var(--sf-text-dim)" }}>
                {product.description}
              </p>
            </div>
          ) : null}

          {/* Specs */}
          {(product.weightGrams || product.lengthCm || product.barcode) ? (
            <dl className="mt-6 grid grid-cols-2 gap-3 text-[13px]">
              {product.weightGrams ? (
                <div>
                  <dt style={{ color: "var(--sf-text-dim)" }}>Weight</dt>
                  <dd style={{ color: "var(--sf-text)" }}>{product.weightGrams} g</dd>
                </div>
              ) : null}
              {product.lengthCm && product.widthCm && product.heightCm ? (
                <div>
                  <dt style={{ color: "var(--sf-text-dim)" }}>Dimensions</dt>
                  <dd style={{ color: "var(--sf-text)" }}>
                    {product.lengthCm} × {product.widthCm} × {product.heightCm} cm
                  </dd>
                </div>
              ) : null}
              {product.barcode ? (
                <div>
                  <dt style={{ color: "var(--sf-text-dim)" }}>Barcode</dt>
                  <dd style={{ color: "var(--sf-text)" }}>{product.barcode}</dd>
                </div>
              ) : null}
              {product.collection ? (
                <div>
                  <dt style={{ color: "var(--sf-text-dim)" }}>Collection</dt>
                  <dd>
                    <Link href={`/shop/${slug}/collections/${product.collection.slug}`} style={{ color: "var(--sf-primary)" }}>
                      {product.collection.name}
                    </Link>
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>
      </div>

      <div id="reviews">
        <ReviewsSection
          slug={slug}
          productId={product.id}
          loggedIn={Boolean(user)}
          average={rating.average}
          count={rating.count}
        />
      </div>

      <QuestionsSection slug={slug} productId={product.id} loggedIn={Boolean(user)} />

      {related.length > 0 ? (
        <section className="mt-14" aria-label="Related products">
          <SectionHeading title="You may also like" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((p) => (
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
        </section>
      ) : null}

      <RecentlyViewed
        current={{
          slug: product.slug,
          name: product.name,
          priceLabel: formatMoney(product.priceCents, product.currency),
          imageUrl: product.images[0]?.url ?? null,
          storeSlug: slug,
        }}
      />
    </div>
  );
}
