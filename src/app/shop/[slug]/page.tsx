import Link from "next/link";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import {
  getLiveStore,
  publicProductWhere,
  PUBLIC_PRODUCT_CARD_SELECT,
  ratingSummary,
  trackVisit,
} from "@/lib/shop/storefront";
import {
  getOrCreateTheme,
  parseSections,
  parseTestimonials,
  parseFaq,
  type ThemeSection,
} from "@/lib/shop/theme";
import { ProductCard, SectionHeading, EmptyNote, Stars } from "@/components/storefront/ui";
import { StorefrontHero } from "@/components/storefront/StorefrontHero";
import { CodeStorefrontView } from "@/components/storefront/CodeStorefrontView";

export default async function StorefrontHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getLiveStore(slug);
  if (!store) notFound();

  const theme = await getOrCreateTheme(store.id);
  const sections = parseSections(theme);
  await trackVisit(store.id, `/shop/${slug}`);

  if (theme.layoutMode === "code" && theme.customHtml) {
    const products = await db.product.findMany({
      where: publicProductWhere(store.id),
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: PUBLIC_PRODUCT_CARD_SELECT,
    });
    return (
      <CodeStorefrontView
        store={{
          name: store.name,
          slug: store.slug,
          description: store.description,
          logo: store.logo,
          industry: store.industry,
        }}
        html={theme.customHtml}
        css={theme.customCss ?? ""}
        js={theme.customJs ?? ""}
        products={products}
        heroHeading={theme.bannerHeading}
        heroSubheading={theme.bannerSubheading}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <StorefrontHero
        slug={slug}
        storeName={store.name}
        heroStyle={theme.heroStyle ?? "classic"}
        motionPreset={theme.motionPreset ?? "none"}
        bannerUrl={theme.bannerUrl}
        bannerHeading={theme.bannerHeading}
        bannerSubheading={theme.bannerSubheading}
      />

      {await Promise.all(sections.map((s, i) => renderSection(s, i, store.id, slug, theme)))}
    </div>
  );
}

async function renderSection(
  section: ThemeSection,
  key: number,
  storeId: string,
  slug: string,
  theme: Awaited<ReturnType<typeof getOrCreateTheme>>
) {
  switch (section.type) {
    case "featured_products": {
      const products = await db.product.findMany({
        where: section.productIds?.length
          ? { ...publicProductWhere(storeId), id: { in: section.productIds } }
          : publicProductWhere(storeId),
        orderBy: { updatedAt: "desc" },
        take: section.limit ?? 8,
        select: PUBLIC_PRODUCT_CARD_SELECT,
      });
      return (
        <section key={key} className="sf-section mt-14" aria-label={section.title ?? "Featured products"}>
          <SectionHeading
            title={section.title ?? "Featured products"}
            action={
              <Link href={`/shop/${slug}/products`} className="text-[13px] font-medium hover:opacity-75" style={{ color: "var(--sf-primary)" }}>
                View all →
              </Link>
            }
          />
          {products.length === 0 ? (
            <EmptyNote>No products published yet — check back soon.</EmptyNote>
          ) : (
            <div className="sf-product-grid grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
        </section>
      );
    }
    case "featured_collections": {
      const collections = await db.collection.findMany({
        where: { storeId },
        take: section.limit ?? 4,
        include: { _count: { select: { products: true } } },
      });
      if (collections.length === 0) return null;
      return (
        <section key={key} className="sf-section mt-14" aria-label={section.title ?? "Collections"}>
          <SectionHeading title={section.title ?? "Shop by collection"} />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {collections.map((c) => (
              <Link
                key={c.id}
                href={`/shop/${slug}/collections/${c.slug}`}
                className="group flex flex-col justify-between border p-5 transition-transform hover:-translate-y-0.5"
                style={{
                  borderRadius: "var(--sf-radius)",
                  borderColor: "var(--sf-card-border)",
                  background: "var(--sf-surface)",
                  minHeight: "120px",
                }}
              >
                <span className="text-[15px] font-semibold" style={{ color: "var(--sf-text)" }}>
                  {c.name}
                </span>
                <span className="text-[12.5px]" style={{ color: "var(--sf-text-dim)" }}>
                  {c._count.products} product{c._count.products === 1 ? "" : "s"} →
                </span>
              </Link>
            ))}
          </div>
        </section>
      );
    }
    case "testimonials": {
      const testimonials = parseTestimonials(theme);
      if (testimonials.length === 0) return null;
      return (
        <section key={key} className="sf-section mt-14" aria-label={section.title ?? "Testimonials"}>
          <SectionHeading title={section.title ?? "What customers say"} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <figure
                key={i}
                className="flex flex-col gap-3 border p-5"
                style={{ borderRadius: "var(--sf-radius)", borderColor: "var(--sf-card-border)", background: "var(--sf-surface)" }}
              >
                {t.rating ? <Stars average={t.rating} count={0} showCount={false} /> : null}
                <blockquote className="text-[14px] leading-relaxed" style={{ color: "var(--sf-text)" }}>
                  “{t.quote}”
                </blockquote>
                <figcaption className="text-[13px] font-medium" style={{ color: "var(--sf-text-dim)" }}>
                  — {t.author}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      );
    }
    case "faq": {
      const faq = parseFaq(theme);
      if (faq.length === 0) return null;
      return (
        <section key={key} className="sf-section mt-14" aria-label={section.title ?? "FAQ"}>
          <SectionHeading title={section.title ?? "Frequently asked questions"} />
          <div className="space-y-3">
            {faq.slice(0, 6).map((f, i) => (
              <details
                key={i}
                className="group border p-4"
                style={{ borderRadius: "var(--sf-radius)", borderColor: "var(--sf-card-border)", background: "var(--sf-surface)" }}
              >
                <summary className="cursor-pointer text-[14px] font-medium" style={{ color: "var(--sf-text)" }}>
                  {f.question}
                </summary>
                <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--sf-text-dim)" }}>
                  {f.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      );
    }
    case "rich_text": {
      if (!section.title && !section.body) return null;
      return (
        <section key={key} className="sf-section mt-14 text-center" aria-label={section.title ?? "About"}>
          {section.title ? (
            <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--sf-text)" }}>
              {section.title}
            </h2>
          ) : null}
          {section.body ? (
            <p className="mx-auto mt-3 max-w-2xl whitespace-pre-line text-[14.5px] leading-relaxed" style={{ color: "var(--sf-text-dim)" }}>
              {section.body}
            </p>
          ) : null}
        </section>
      );
    }
    default:
      return null;
  }
}
